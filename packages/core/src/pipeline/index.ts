import { GatewayRequest, GatewayResponse, GatewayStreamChunk, IProvider } from '../types';
import { RequestClassifier } from './classifier';
import { RoutingEngine, RoutingStrategy } from '../routing/engine';
import { ModelRegistry } from '../model-registry';
import { CircuitBreaker } from '../circuit-breaker';
import { MetricsLogger } from '../metrics/logger';
import crypto from 'crypto';

export class PipelineOrchestrator {
  private routingEngine: RoutingEngine;

  constructor(
    private registeredProviders: IProvider[],
    userWeighting: Record<string, number> = {}
  ) {
    this.routingEngine = new RoutingEngine(userWeighting);
  }

  /**
   * Executes a standard chat completion request with failover support.
   */
  async execute(request: GatewayRequest, signal?: AbortSignal): Promise<GatewayResponse> {
    const classification = RequestClassifier.classify(request);
    
    // 1. Filter providers by required capabilities
    const eligibleProviders = this.registeredProviders.filter(p => 
      RequestClassifier.providerMeetsRequirements(classification, p.capabilities)
    );

    if (eligibleProviders.length === 0) {
      throw new Error('No registered providers meet the requirements for this request (e.g., maxContext, jsonMode).');
    }

    // 2. Score providers dynamically
    const strategy = classification.requiresJsonMode ? RoutingStrategy.JSON_RELIABLE 
                   : classification.isHeavyTask ? RoutingStrategy.LARGE_CONTEXT 
                   : RoutingStrategy.FASTEST;

    const scoredProviders = await this.routingEngine.scoreProviders(eligibleProviders, strategy);

    if (scoredProviders.length === 0) {
      throw new Error('All eligible providers are currently unhealthy or out of quota.');
    }

    // 3. Cascade execution
    let lastError: any = null;
    const requestId = crypto.randomUUID();
    const startTime = performance.now();

    for (const { provider } of scoredProviders) {
      // Abort early if the client disconnected
      if (signal?.aborted) throw new Error('Request aborted by client');

      const breaker = new CircuitBreaker(provider.name);

      try {
        await breaker.acquireTicket();
      } catch (err: any) {
        // Circuit is open, skip this provider
        console.log(`[Freeloader] Skipping provider ${provider.name} (Circuit Open)`);
        continue;
      }

      try {
        // Model Virtualization: Translate requested model to provider-specific model
        const actualModel = request.model ? ModelRegistry.resolveForProvider(request.model, provider.name) : undefined;
        
        // Clone the request and inject the translated model
        const providerRequest = { ...request, model: actualModel };

        // Attempt the execution
        const response = await provider.chatCompletion(providerRequest, signal);
        
        await breaker.recordSuccess();

        const latencyMs = Math.round(performance.now() - startTime);
        const promptTokens = response.usage?.prompt_tokens || 0;
        const completionTokens = response.usage?.completion_tokens || 0;
        const totalTokens = response.usage?.total_tokens || (promptTokens + completionTokens);

        await MetricsLogger.logEvent({
          id: requestId,
          provider: provider.name,
          status: 'success',
          latencyMs,
          tokens: totalTokens,
          timestamp: new Date().toISOString()
        }, promptTokens, completionTokens);

        // Successfully executed, return immediately
        return response;
      } catch (err: any) {
        lastError = err;
        const latencyMs = Math.round(performance.now() - startTime);
        
        await MetricsLogger.logEvent({
          id: requestId,
          provider: provider.name,
          status: 'failure',
          latencyMs,
          tokens: 0,
          timestamp: new Date().toISOString()
        });

        // Log failure for this provider and continue to the next one in the cascade
        console.warn(`[Freeloader] Provider ${provider.name} failed:`, err.message);
        await breaker.recordFailure();
      }
    }

    // If we exhaust the cascade, throw the last encountered error
    throw new Error(`All providers failed. Last error: ${lastError?.message}`);
  }

  /**
   * Executes a streaming chat completion request with failover support.
   * Note: Failover is only possible BEFORE the first chunk is emitted.
   */
  async *executeStream(request: GatewayRequest, signal?: AbortSignal): AsyncGenerator<GatewayStreamChunk> {
    const classification = RequestClassifier.classify(request);
    classification.requiresStreaming = true; // Ensure this is forced

    const eligibleProviders = this.registeredProviders.filter(p => 
      RequestClassifier.providerMeetsRequirements(classification, p.capabilities)
    );

    if (eligibleProviders.length === 0) {
      throw new Error('No registered providers support streaming for this request.');
    }

    const strategy = classification.isHeavyTask ? RoutingStrategy.LARGE_CONTEXT : RoutingStrategy.FASTEST;
    const scoredProviders = await this.routingEngine.scoreProviders(eligibleProviders, strategy);

    if (scoredProviders.length === 0) {
      throw new Error('All eligible providers are currently unhealthy or out of quota.');
    }

    let lastError: any = null;
    const requestId = crypto.randomUUID();
    const startTime = performance.now();

    for (const { provider } of scoredProviders) {
      if (signal?.aborted) throw new Error('Request aborted by client');

      const breaker = new CircuitBreaker(provider.name);

      try {
        await breaker.acquireTicket();
      } catch (err: any) {
        console.log(`[Freeloader] Skipping provider ${provider.name} for stream (Circuit Open)`);
        continue;
      }

      const actualModel = request.model ? ModelRegistry.resolveForProvider(request.model, provider.name) : undefined;
      const providerRequest = { ...request, model: actualModel };

      let streamGeneratedBytes = false;
      
      try {
        const stream = provider.chatCompletionStream(providerRequest, signal);

        let promptTokens = 0;
        let completionTokens = 0;

        for await (const chunk of stream) {
          if (!streamGeneratedBytes) {
             streamGeneratedBytes = true; // Once we yield, we CANNOT retry
             // We consider the first successful byte as a success for the breaker
             await breaker.recordSuccess();
          }
          if (chunk.usage) {
            promptTokens = chunk.usage.prompt_tokens || 0;
            completionTokens = chunk.usage.completion_tokens || 0;
          }
          yield chunk;
        }

        const latencyMs = Math.round(performance.now() - startTime);
        const totalTokens = promptTokens + completionTokens;

        await MetricsLogger.logEvent({
          id: requestId,
          provider: provider.name,
          status: 'success',
          latencyMs,
          tokens: totalTokens,
          timestamp: new Date().toISOString()
        }, promptTokens, completionTokens);

        // Stream completed successfully
        return;

      } catch (err: any) {
        lastError = err;
        console.warn(`[Freeloader] Provider ${provider.name} stream failed:`, err.message);
        
        const latencyMs = Math.round(performance.now() - startTime);
        
        if (streamGeneratedBytes) {
          // If we already started sending bytes to the client, we cannot failover to another provider.
          // We must bubble up the error to terminate the stream safely.
          throw new Error(`[Freeloader] Stream interrupted mid-flight from ${provider.name}: ${err.message}`);
        }
        
        await MetricsLogger.logEvent({
          id: requestId,
          provider: provider.name,
          status: 'failure',
          latencyMs,
          tokens: 0,
          timestamp: new Date().toISOString()
        });

        // If we haven't yielded any bytes yet, it's safe to record failure, continue the loop and failover.
        await breaker.recordFailure();
      }
    }

    throw new Error(`All providers failed to start streaming. Last error: ${lastError?.message}`);
  }
}
