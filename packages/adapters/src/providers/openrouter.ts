import { IProvider, ProviderCapability, GatewayRequest, GatewayResponse, GatewayStreamChunk } from '@freeloaderapi/core';
import { BaseAdapter, ProviderError } from '../base';

export class OpenRouterAdapter extends BaseAdapter {
  readonly name = 'openrouter';
  readonly capabilities: ProviderCapability = {
    streaming: true,
    jsonMode: true,
    maxContext: 128000,
    toolCalling: true
  };

  private get apiKey(): string {
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) throw new ProviderError(this.name, 'OPENROUTER_API_KEY is not configured', 500);
    return key;
  }

  async getHealthScore(): Promise<number> {
    return 100;
  }

  async getEstimatedRemainingQuota(): Promise<number> {
    // OpenRouter has free models, effectively unlimited if using the free tier tags
    return 10000;
  }

  supportsModel(model: string): boolean {
    return true; // OpenRouter supports everything
  }

  async _chatCompletion(request: GatewayRequest, signal?: AbortSignal): Promise<GatewayResponse> {
    const model = request.model || 'openrouter/auto';
    const url = 'https://openrouter.ai/api/v1/chat/completions';
    
    const startTime = Date.now();
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': 'https://freeloader.dev',
        'X-Title': 'Freeloader Gateway'
      },
      body: JSON.stringify({ ...request, model, stream: false }),
      signal
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new ProviderError(this.name, `OpenRouter API error: ${errorText}`, response.status);
    }

    const data = await response.json();
    const latencyMs = Date.now() - startTime;

    return {
      ...data,
      provider_used: this.name,
      latency_ms: latencyMs
    };
  }

  async *_chatCompletionStream(request: GatewayRequest, signal?: AbortSignal): AsyncGenerator<GatewayStreamChunk> {
    const model = request.model || 'openrouter/auto';
    const url = 'https://openrouter.ai/api/v1/chat/completions';
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': 'https://freeloader.dev',
        'X-Title': 'Freeloader Gateway'
      },
      body: JSON.stringify({ ...request, model, stream: true }),
      signal
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new ProviderError(this.name, `OpenRouter Streaming API error: ${errorText}`, response.status);
    }

    if (!response.body) throw new ProviderError(this.name, 'No response body returned from OpenRouter');

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
            if (dataStr.trim() === '[DONE]') continue;
            
            try {
              const data = JSON.parse(dataStr);
              yield data as GatewayStreamChunk;
            } catch (e) {
              console.warn('[OpenRouterAdapter] Error parsing SSE chunk:', e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}
