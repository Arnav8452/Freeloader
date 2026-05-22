import { IProvider, ProviderCapability, GatewayRequest, GatewayResponse, GatewayStreamChunk } from '@freeloader/core';

export class ProviderError extends Error {
  constructor(
    public readonly provider: string,
    message: string,
    public readonly status?: number,
    public readonly cause?: any
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}

export abstract class BaseAdapter implements IProvider {
  abstract readonly name: string;
  abstract readonly capabilities: ProviderCapability;

  abstract getHealthScore(): Promise<number>;
  abstract getEstimatedRemainingQuota(): Promise<number>;
  abstract supportsModel(model: string): boolean;

  abstract _chatCompletion(request: GatewayRequest, signal?: AbortSignal): Promise<GatewayResponse>;
  abstract _chatCompletionStream(request: GatewayRequest, signal?: AbortSignal): AsyncGenerator<GatewayStreamChunk>;

  async chatCompletion(request: GatewayRequest, signal?: AbortSignal): Promise<GatewayResponse> {
    try {
      // Implement sandboxing / timeouts here if not handled at a higher level
      return await this._chatCompletion(request, signal);
    } catch (error: any) {
      if (error instanceof ProviderError) throw error;
      throw new ProviderError(this.name, error.message || 'Unknown provider error', error.status, error);
    }
  }

  async *chatCompletionStream(request: GatewayRequest, signal?: AbortSignal): AsyncGenerator<GatewayStreamChunk> {
    try {
      yield* this._chatCompletionStream(request, signal);
    } catch (error: any) {
      if (error instanceof ProviderError) throw error;
      throw new ProviderError(this.name, error.message || 'Unknown provider streaming error', error.status, error);
    }
  }
}
