export interface VirtualModelMapping {
  requestedModel: string;
  providerModelMap: Record<string, string>; // providerName -> actualModelName
}

const modelMappings: VirtualModelMapping[] = [
  {
    requestedModel: 'gpt-4o',
    providerModelMap: {
      gemini: 'gemini-2.5-flash',
      groq: 'llama-3.1-8b-instant',
      cerebras: 'llama3.1-8b',
      openrouter: 'openrouter/auto',
    }
  },
  {
    requestedModel: 'gpt-4o-mini',
    providerModelMap: {
      gemini: 'gemini-2.5-flash',
      groq: 'llama-3.1-8b-instant',
      cerebras: 'llama3.1-8b',
      openrouter: 'meta-llama/llama-3-8b-instruct:free',
    }
  },
  {
    requestedModel: 'gpt-3.5-turbo',
    providerModelMap: {
      gemini: 'gemini-2.5-flash',
      groq: 'llama-3.1-8b-instant',
      cerebras: 'llama3.1-8b',
      openrouter: 'openrouter/auto',
    }
  },
  {
    requestedModel: 'claude-3-5-sonnet',
    providerModelMap: {
      gemini: 'gemini-2.5-flash',
      groq: 'llama-3.1-8b-instant',
      cerebras: 'llama3.1-8b',
      openrouter: 'anthropic/claude-3.5-sonnet:beta',
    }
  }
];

export class ModelRegistry {
  /**
   * Resolves a requested model name (e.g. 'gpt-4o-mini') to the specific internal model
   * name for a given provider (e.g. 'gemini-1.5-flash' for 'gemini').
   * If no mapping is found, it returns the requested model by default.
   */
  static resolveForProvider(requestedModel: string, providerName: string): string {
    const mapping = modelMappings.find(m => m.requestedModel === requestedModel || requestedModel.startsWith(m.requestedModel));
    
    if (mapping && mapping.providerModelMap[providerName]) {
      return mapping.providerModelMap[providerName];
    }
    
    // Default fallback: assume the provider understands the model natively or it's an OpenRouter pass-through
    return requestedModel;
  }
  
  /**
   * Identifies the tier of the model (heavy vs lightweight) based on known aliases.
   * Useful for request classification.
   */
  static isHeavyModel(requestedModel: string): boolean {
    const heavyKeywords = ['gpt-4', 'claude-3', 'opus', 'sonnet', 'pro', '70b', 'large'];
    return heavyKeywords.some(keyword => requestedModel.toLowerCase().includes(keyword)) && !requestedModel.toLowerCase().includes('mini');
  }
}
