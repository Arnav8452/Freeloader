import { IProvider, ProviderCapability, GatewayRequest, GatewayResponse, GatewayStreamChunk } from '@freeloader/core';
import { BaseAdapter, ProviderError } from '../base';

export class OllamaAdapter extends BaseAdapter {
  readonly name = 'ollama';
  readonly capabilities: ProviderCapability = {
    streaming: true,
    jsonMode: true,
    maxContext: 8192,
    toolCalling: false // Local Ollama tool calling is hit or miss depending on model
  };

  private get baseUrl(): string {
    return process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  }

  async getHealthScore(): Promise<number> {
    try {
      const response = await fetch(this.baseUrl, { method: 'HEAD' });
      return response.ok ? 100 : 0;
    } catch {
      return 0; // Local instance is offline
    }
  }

  async getEstimatedRemainingQuota(): Promise<number> {
    return Number.MAX_SAFE_INTEGER; // Unlimited local quota
  }

  supportsModel(model: string): boolean {
    // Assuming local ollama has standard models. In reality we'd ping /api/tags
    return true; 
  }

  async _chatCompletion(request: GatewayRequest, signal?: AbortSignal): Promise<GatewayResponse> {
    const model = request.model || 'llama3';
    const url = `${this.baseUrl}/v1/chat/completions`;
    
    const startTime = Date.now();
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      // Ollama's v1 compatibility endpoint supports OpenAI format directly
      body: JSON.stringify({ ...request, model, stream: false }),
      signal
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new ProviderError(this.name, `Ollama API error: ${errorText}`, response.status);
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
    const model = request.model || 'llama3';
    const url = `${this.baseUrl}/v1/chat/completions`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ...request, model, stream: true }),
      signal
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new ProviderError(this.name, `Ollama Streaming API error: ${errorText}`, response.status);
    }

    if (!response.body) throw new ProviderError(this.name, 'No response body returned from Ollama');

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
              console.warn('[OllamaAdapter] Error parsing SSE chunk:', e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}
