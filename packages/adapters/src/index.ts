export * from './base';
export * from './providers/gemini';
export * from './providers/groq';
export * from './providers/openrouter';
export * from './providers/ollama';
export * from './providers/cerebras';
export * from './omniRouteWrapper';

import { OmniRouteWrapperAdapter } from './omniRouteWrapper';

// Hide the import from the TypeScript compiler to prevent it from parsing 4000+ files
const compatPkg = '@freeloaderapi/omniroute-compat';

let executors: any = {};
let REGISTRY: any = {};
let getExecutor: any = (id: string) => null;

try {
  // @ts-ignore
  const compat = await import(compatPkg);
  executors = compat.executors || {};
  REGISTRY = compat.REGISTRY || {};
  getExecutor = compat.getExecutor || ((id: string) => null);
} catch (err) {
  console.warn("Could not load omniroute-compat dynamically", err);
}

export const omniRouteProviders = [
  // The ~56 Web Scraper executors
  ...Object.values(executors).map((executor: any) => new OmniRouteWrapperAdapter(executor)),
  // The 120+ standard API LLM providers
  ...Object.keys(REGISTRY).map((providerId: string) => new OmniRouteWrapperAdapter(getExecutor(providerId)))
];
