import { IProvider } from '../types';

export enum RoutingStrategy {
  FASTEST = 'fastest',
  CHEAPEST = 'cheapest',
  JSON_RELIABLE = 'json_reliable',
  LARGE_CONTEXT = 'large_context',
  FALLBACK_ONLY = 'fallback_only',
}

export interface ProviderWeighting {
  [providerName: string]: number; // Multiplier, e.g., 2.0 means twice as preferred
}

export class RoutingEngine {
  constructor(private userWeighting: ProviderWeighting = {}) {}

  /**
   * Scores a list of providers asynchronously. Higher score is better.
   * Providers that return 0 or throw an error during scoring are filtered out.
   */
  async scoreProviders(
    providers: IProvider[],
    strategy: RoutingStrategy
  ): Promise<{ provider: IProvider; score: number }[]> {
    const scoredPromises = providers.map(async (provider) => {
      try {
        const healthScore = await provider.getHealthScore();
        if (healthScore <= 0) return null; // Provider is dead or circuit breaker is fully open

        const estimatedQuota = await provider.getEstimatedRemainingQuota();
        if (estimatedQuota <= 0) return null; // Quota exhausted

        let baseScore = healthScore;

        // Apply strategy-specific logic
        switch (strategy) {
          case RoutingStrategy.FASTEST:
            // Assuming higher healthScore correlates with lower latency (or we can inject latency data directly)
            baseScore *= 1.5;
            break;
          case RoutingStrategy.CHEAPEST:
            // Prioritize completely free/local over providers that might have tiny costs or stricter quotas
            if (provider.name === 'ollama') baseScore *= 2.0;
            break;
          case RoutingStrategy.LARGE_CONTEXT:
            if (provider.capabilities.maxContext >= 128000) baseScore *= 2.0;
            break;
          case RoutingStrategy.JSON_RELIABLE:
            if (provider.name === 'groq' || provider.name === 'gemini') baseScore *= 1.5;
            break;
          default:
            break;
        }

        // Apply operator-defined weighting preferences
        const weightMultiplier = this.userWeighting[provider.name] || 1.0;
        const finalScore = baseScore * weightMultiplier;

        return { provider, score: finalScore };
      } catch (err) {
        // If scoring fails, assume provider is unhealthy for this round
        return null;
      }
    });

    const results = await Promise.all(scoredPromises);
    
    // Filter out nulls and sort descending by score
    const validResults = results.filter((res): res is { provider: IProvider; score: number } => res !== null);
    validResults.sort((a, b) => b.score - a.score);

    return validResults;
  }
}
