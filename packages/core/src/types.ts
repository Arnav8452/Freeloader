export interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
}

export interface GatewayRequest {
  messages: Message[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  response_format?: {
    type: 'json_object';
  };
}

export interface GatewayStreamChunk {
  id: string;
  object: 'chat.completion.chunk';
  created: number;
  model: string;
  choices: {
    index: number;
    delta: {
      content?: string;
      role?: string;
    };
    finish_reason: string | null;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface GatewayResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: {
    message: Message;
    finish_reason?: string;
    index: number;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  provider_used: string;
  latency_ms: number;
}

export interface ProviderCapability {
  streaming: boolean;
  jsonMode: boolean;
  maxContext: number;
  toolCalling: boolean;
}

export interface IProvider {
  name: string;
  capabilities: ProviderCapability;
  
  getHealthScore(): Promise<number>;
  getEstimatedRemainingQuota(): Promise<number>;
  supportsModel(model: string): boolean;
  
  chatCompletion(request: GatewayRequest, signal?: AbortSignal): Promise<GatewayResponse>;
  chatCompletionStream(request: GatewayRequest, signal?: AbortSignal): AsyncGenerator<GatewayStreamChunk>;
}
