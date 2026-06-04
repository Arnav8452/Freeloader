export * from './base';
export * from './providers/gemini';
export * from './providers/groq';
export * from './providers/openrouter';
export * from './providers/ollama';
export * from './providers/cerebras';
export * from './omniRouteWrapper';

import { OmniRouteWrapperAdapter } from './omniRouteWrapper';
import { BaseAdapter } from './base';

export async function getOmniRouteProviders(): Promise<BaseAdapter[]> {
  const compatPkg = '@freeloaderapi/omniroute-compat';
  try {
    const compat = await import(compatPkg);
    const executors = compat.executors || {};
    const REGISTRY = compat.REGISTRY || {};
    const getExecutor = compat.getExecutor || ((id: string) => null);

    return [
      ...Object.values(executors).map((executor: any) => new OmniRouteWrapperAdapter(executor)),
      ...Object.keys(REGISTRY).map((providerId: string) => new OmniRouteWrapperAdapter(getExecutor(providerId)))
    ];
  } catch (err) {
    console.warn("Could not load omniroute-compat dynamically", err);
    return [];
  }
}
