import { IProvider, ProviderCapability, GatewayRequest, GatewayResponse, GatewayStreamChunk } from '@freeloader/core';
import { BaseAdapter, ProviderError } from '../base';

export class GeminiAdapter extends BaseAdapter {
  readonly name = 'gemini';
  readonly capabilities: ProviderCapability = {
    streaming: true,
    jsonMode: true,
    maxContext: 1048576, // 1M tokens for pro/flash
    toolCalling: true
  };

  private get apiKey(): string {
    const key = process.env.GOOGLE_API_KEY;
    if (!key) throw new ProviderError(this.name, 'GOOGLE_API_KEY is not configured', 500);
    return key;
  }

  async getHealthScore(): Promise<number> {
    // In a real implementation, this would query a health endpoint or return dynamic stats
    return 100;
  }

  async getEstimatedRemainingQuota(): Promise<number> {
    // Google AI Studio free tier allows 15 RPM for Pro, 15 RPM for Flash.
    return 1000;
  }

  supportsModel(model: string): boolean {
    return model.startsWith('gemini-');
  }

  private transformRequest(request: GatewayRequest): any {
    // Convert OpenAI message format to Gemini format
    const contents = request.messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    return {
      contents,
      generationConfig: {
        temperature: request.temperature ?? 0.7,
        maxOutputTokens: request.max_tokens,
        responseMimeType: request.response_format?.type === 'json_object' ? 'application/json' : 'text/plain'
      }
    };
  }

  async _chatCompletion(request: GatewayRequest, signal?: AbortSignal): Promise<GatewayResponse> {
    const model = request.model || 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;
    
    const startTime = Date.now();
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this.transformRequest(request)),
      signal
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new ProviderError(this.name, `Gemini API error: ${errorText}`, response.status);
    }

    const data = await response.json();
    const latencyMs = Date.now() - startTime;

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Very rough estimation since Gemini doesn't always return exact token counts in the same shape
    const usage = data.usageMetadata || {
      promptTokenCount: 0,
      candidatesTokenCount: 0,
      totalTokenCount: 0
    };

    return {
      id: `chatcmpl-${crypto.randomUUID()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model,
      choices: [
        {
          message: {
            role: 'assistant',
            content: text
          },
          finish_reason: data.candidates?.[0]?.finishReason?.toLowerCase() || 'stop',
          index: 0
        }
      ],
      usage: {
        prompt_tokens: usage.promptTokenCount,
        completion_tokens: usage.candidatesTokenCount,
        total_tokens: usage.totalTokenCount
      },
      provider_used: this.name,
      latency_ms: latencyMs
    };
  }

  async *_chatCompletionStream(request: GatewayRequest, signal?: AbortSignal): AsyncGenerator<GatewayStreamChunk> {
    const model = request.model || 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${this.apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this.transformRequest(request)),
      signal
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new ProviderError(this.name, `Gemini Streaming API error: ${errorText}`, response.status);
    }

    if (!response.body) throw new ProviderError(this.name, 'No response body returned from Gemini');

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    const streamId = `chatcmpl-${crypto.randomUUID()}`;
    const created = Math.floor(Date.now() / 1000);

    // Yield initial role
    yield {
      id: streamId,
      object: 'chat.completion.chunk',
      created,
      model,
      choices: [{ index: 0, delta: { role: 'assistant' }, finish_reason: null }]
    };

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr === '[DONE]') continue;
            
            try {
              const data = JSON.parse(dataStr);
              const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
              
              if (text) {
                yield {
                  id: streamId,
                  object: 'chat.completion.chunk',
                  created,
                  model,
                  choices: [{ index: 0, delta: { content: text }, finish_reason: null }]
                };
              }
              
              const finishReason = data.candidates?.[0]?.finishReason;
              if (finishReason) {
                yield {
                  id: streamId,
                  object: 'chat.completion.chunk',
                  created,
                  model,
                  choices: [{ index: 0, delta: {}, finish_reason: finishReason.toLowerCase() }]
                };
              }
            } catch (e) {
              console.warn('[GeminiAdapter] Error parsing SSE chunk:', e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}
