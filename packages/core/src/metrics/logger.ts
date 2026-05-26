import { CacheManager } from '../cache/CacheManager';

export interface RoutingEvent {
  id: string;
  provider: string;
  status: 'success' | 'failure';
  latencyMs: number;
  tokens: number;
  timestamp: string;
}

export class MetricsLogger {
  // Approximate GPT-4o-mini costs per token in cents
  private static readonly INPUT_COST_CENTS = 0.000015; // $0.15 per 1M = 15 cents per 1M = 0.000015 per token
  private static readonly OUTPUT_COST_CENTS = 0.000060; // $0.60 per 1M = 60 cents per 1M = 0.000060 per token

  static async logEvent(event: RoutingEvent, promptTokens: number = 0, completionTokens: number = 0): Promise<void> {
    const cache = CacheManager.getInstance();
    
    try {
      // 1. Increment total requests
      await cache.increment('freeloader:stats:requests_total');

      // 2. Increment provider requests
      await cache.increment(`freeloader:stats:provider:${event.provider}:requests`);

      // 3. Calculate and increment savings in cents
      const savings = (promptTokens * this.INPUT_COST_CENTS) + (completionTokens * this.OUTPUT_COST_CENTS);
      if (savings > 0) {
        await cache.incrementFloat('freeloader:stats:savings_cents', savings);
      }

      // 4. Push to recent logs (capped at 50)
      await cache.listPush('freeloader:logs:recent', event, 50);
    } catch (err) {
      console.error('[Freeloader Metrics] Failed to log event:', err);
    }
  }

  static async getDashboardMetrics(): Promise<any> {
    const cache = CacheManager.getInstance();
    
    // Fetch total requests
    const totalRequestsStr = await cache.get('freeloader:stats:requests_total');
    const totalRequests = parseInt(totalRequestsStr || '0', 10);

    // Fetch estimated savings
    const savingsStr = await cache.get('freeloader:stats:savings_cents');
    const estimatedSavings = parseFloat(savingsStr || '0') / 100; // Convert cents to dollars

    // Fetch recent logs
    const recentLogsRaw = await cache.listRange('freeloader:logs:recent', 0, 49);
    const recentLogs = recentLogsRaw.map(log => typeof log === 'string' ? JSON.parse(log) : log);

    // Fetch provider usage (scan for keys)
    const providerKeys = await cache.keys('freeloader:stats:provider:*:requests');
    const providerUsage: Record<string, number> = {};
    let totalProviderRequests = 0;

    if (providerKeys.length > 0) {
      const counts = await cache.mget(providerKeys);
      providerKeys.forEach((key, i) => {
        const providerName = key.split(':')[3];
        const count = parseInt(counts[i] || '0', 10);
        providerUsage[providerName] = count;
        totalProviderRequests += count;
      });
    }

    // Convert usage to percentages
    const providerDistribution: Record<string, number> = {};
    for (const [provider, count] of Object.entries(providerUsage)) {
      providerDistribution[provider] = totalProviderRequests > 0 
        ? Math.round((count / totalProviderRequests) * 100) 
        : 0;
    }

    return {
      totalRequests,
      estimatedSavings,
      recentLogs,
      providerUsage: providerDistribution
    };
  }
}
