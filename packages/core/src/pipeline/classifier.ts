import { GatewayRequest, ProviderCapability } from '../types';
import { ModelRegistry } from '../model-registry';

export interface RequestClassification {
  requiresStreaming: boolean;
  requiresJsonMode: boolean;
  requiresToolCalling: boolean;
  isHeavyTask: boolean;
  estimatedPromptTokens: number;
}

export class RequestClassifier {
  /**
   * Analyzes an incoming GatewayRequest to determine its capabilities and constraints.
   */
  static classify(request: GatewayRequest): RequestClassification {
    const requiresStreaming = !!request.stream;
    const requiresJsonMode = request.response_format?.type === 'json_object';
    
    // Check if tools/functions array exists and has items (future compatibility)
    const requiresToolCalling = Array.isArray((request as any).tools) && (request as any).tools.length > 0;
    
    const isHeavyTask = request.model ? ModelRegistry.isHeavyModel(request.model) : false;
    
    // Very rough estimation: 1 token ~= 4 characters in English text
    let estimatedPromptTokens = 0;
    for (const msg of request.messages) {
      estimatedPromptTokens += Math.ceil(msg.content.length / 4);
    }

    return {
      requiresStreaming,
      requiresJsonMode,
      requiresToolCalling,
      isHeavyTask,
      estimatedPromptTokens
    };
  }

  /**
   * Evaluates whether a given provider meets the classified requirements of a request.
   */
  static providerMeetsRequirements(
    classification: RequestClassification,
    capabilities: ProviderCapability
  ): boolean {
    if (classification.requiresStreaming && !capabilities.streaming) return false;
    if (classification.requiresJsonMode && !capabilities.jsonMode) return false;
    if (classification.requiresToolCalling && !capabilities.toolCalling) return false;
    
    if (classification.estimatedPromptTokens > capabilities.maxContext) {
      return false;
    }

    return true;
  }
}
