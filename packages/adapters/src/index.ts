export * from './base';
export * from './providers/gemini';
export * from './providers/groq';
export * from './providers/openrouter';
export * from './providers/ollama';
export * from './providers/cerebras';
export * from './omniRouteWrapper';

// Uncomment this block when compat package is built, or use tsx to run directly
// import { executors, REGISTRY, getExecutor } from '@freeloaderapi/omniroute-compat';
// import { OmniRouteWrapperAdapter } from './omniRouteWrapper';
// 
// export const omniRouteProviders = [
//   // The ~56 Web Scraper executors
//   ...Object.values(executors).map(executor => new OmniRouteWrapperAdapter(executor)),
//   // The 120+ standard API LLM providers
//   ...Object.keys(REGISTRY || {}).map(providerId => new OmniRouteWrapperAdapter(getExecutor(providerId)))
// ];
