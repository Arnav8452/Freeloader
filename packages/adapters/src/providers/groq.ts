import { IProvider, ProviderCapability, GatewayRequest, GatewayResponse, GatewayStreamChunk } from '@freeloaderapi/core';
import { BaseAdapter, ProviderError } from '../base';

export class GroqAdapter extends BaseAdapter {
  readonly name = 'groq';
  readonly capabilities: ProviderCapability = {
    streaming: true,
    jsonMode: true,
    maxContext: 32768, // mixtral is 32k, llama3 is 8k, we'll take the max and let engine handle specifics later
    toolCalling: true
  };

  private get apiKey(): string {
    const key = process.env.GROQ_API_KEY;
    if (!key) throw new ProviderError(this.name, 'GROQ_API_KEY is not configured', 500);
    return key;
  }

  async getHealthScore(): Promise<number> {
    return 100;
  }

  async getEstimatedRemainingQuota(): Promise<number> {
    // Groq has variable limits, typically 30 RPM
    return 1000;
  }

  supportsModel(model: string): boolean {
    return model.includes('llama') || model.includes('mixtral') || model.includes('gemma');
  }

  async _chatCompletion(request: GatewayRequest, signal?: AbortSignal): Promise<GatewayResponse> {
    const model = request.model || 'llama3-8b-8192';
    const url = 'https://api.groq.com/openai/v1/chat/completions';
    
    const startTime = Date.now();
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({ ...request, model, stream: false }),
      signal
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new ProviderError(this.name, `Groq API error: ${errorText}`, response.status);
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
    const model = request.model || 'llama3-8b-8192';
    const url = 'https://api.groq.com/openai/v1/chat/completions';
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({ ...request, model, stream: true }),
      signal
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new ProviderError(this.name, `Groq Streaming API error: ${errorText}`, response.status);
    }

    if (!response.body) throw new ProviderError(this.name, 'No response body returned from Groq');

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
              console.warn('[GroqAdapter] Error parsing SSE chunk:', e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}
