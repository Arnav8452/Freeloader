export * from './base';
export * from './providers/gemini';
export * from './providers/groq';
export * from './providers/openrouter';
export * from './providers/ollama';
export * from './providers/cerebras';
export * from './omniRouteWrapper';

// Temporarily commented out to avoid TS errors if the compat package isn't fully built yet
// import { executors } from '@freeloaderapi/omniroute-compat/open-sse/executors/index.js';
// import { OmniRouteWrapperAdapter } from './omniRouteWrapper';
// export const omniRouteProviders = Object.values(executors).map(executor => new OmniRouteWrapperAdapter(executor));
