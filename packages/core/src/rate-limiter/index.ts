import { CacheManager } from '../cache/CacheManager';

export interface RateLimitConfig {
  requestsPerMinute: number;
}

export class RateLimiter {
  private cache = CacheManager.getInstance();

  /**
   * Checks if a request is allowed based on a sliding window rate limit.
   * Key can be an IP address or a user API key hash.
   */
  async checkLimit(key: string, config: RateLimitConfig): Promise<{ allowed: boolean; remaining: number }> {
    const now = Date.now();
    const windowMs = 60000; // 1 minute
    const windowStart = now - windowMs;
    const currentCount = await this.cache.recordRateLimitHit(`ratelimit:${key}`, now, windowMs);
    
    if (currentCount >= config.requestsPerMinute) {
      // Limit exceeded
      return { allowed: false, remaining: 0 };
    }

    return { allowed: true, remaining: config.requestsPerMinute - currentCount - 1 };
  }
}
