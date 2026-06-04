import { IProvider, ProviderCapability, GatewayRequest, GatewayResponse, GatewayStreamChunk } from '@freeloaderapi/core';
import { BaseAdapter, ProviderError } from './base';
// We import BaseExecutor type from omniroute-compat to wrap it
import type { BaseExecutor, ExecuteInput } from '@freeloaderapi/omniroute-compat/open-sse/executors/base.ts';

export class OmniRouteWrapperAdapter extends BaseAdapter {
  readonly name: string;
  readonly capabilities: ProviderCapability = {
    streaming: true,
    jsonMode: true,
    maxContext: 1048576,
    toolCalling: true
  };

  private executor: BaseExecutor;
  
  constructor(executor: BaseExecutor) {
    super();
    this.executor = executor;
    this.name = executor.getProvider();
  }

  async getHealthScore(): Promise<number> {
    return 100;
  }

  async getEstimatedRemainingQuota(): Promise<number> {
    return 1000;
  }

  supportsModel(model: string): boolean {
    return true; // We pass through all models to the OmniRoute executor
  }

  private transformRequestToOmniRouteInput(request: GatewayRequest, signal?: AbortSignal): ExecuteInput {
    // Transform GatewayRequest to OmniRoute ExecuteInput
    const credentials = {
      apiKey: process.env[`${this.name.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_API_KEY`],
      // Add more credential mappings if needed
    };

    return {
      model: request.model || 'default-model',
      body: {
        messages: request.messages,
        temperature: request.temperature,
        max_tokens: request.max_tokens,
      },
      stream: false,
      credentials,
      signal,
    };
  }

  async _chatCompletion(request: GatewayRequest, signal?: AbortSignal): Promise<GatewayResponse> {
    const input = this.transformRequestToOmniRouteInput(request, signal);
    input.stream = false;

    const result = await this.executor.execute(input);
    const response = await result.response;
    
    if (!response.ok) {
        const errText = await response.text();
        throw new ProviderError(this.name, `OmniRoute Executor Error: ${errText}`, response.status);
    }
    
    const data = await response.json();
    
    return {
      id: data.id || `chatcmpl-${crypto.randomUUID()}`,
      object: 'chat.completion',
      created: data.created || Math.floor(Date.now() / 1000),
      model: data.model || request.model,
      choices: data.choices || [],
      usage: data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      provider_used: this.name,
      latency_ms: 0
    };
  }

  async *_chatCompletionStream(request: GatewayRequest, signal?: AbortSignal): AsyncGenerator<GatewayStreamChunk> {
    const input = this.transformRequestToOmniRouteInput(request, signal);
    input.stream = true;

    const result = await this.executor.execute(input);
    const response = await result.response;
    
    if (!response.ok) {
        const errText = await response.text();
        throw new ProviderError(this.name, `OmniRoute Executor Error: ${errText}`, response.status);
    }
    
    if (!response.body) throw new ProviderError(this.name, 'No response body returned from Executor');

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr === '[DONE]') continue;
            
            try {
              const data = JSON.parse(dataStr);
              yield data as GatewayStreamChunk;
            } catch (e) {
              console.warn(`[${this.name} Wrapper] Error parsing SSE chunk:`, e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}
