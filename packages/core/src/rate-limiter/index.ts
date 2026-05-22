import { RedisClient } from '../redis/client';

export interface RateLimitConfig {
  requestsPerMinute: number;
}

export class RateLimiter {
  private redis = RedisClient.getInstance();

  /**
   * Checks if a request is allowed based on a sliding window rate limit.
   * Key can be an IP address or a user API key hash.
   */
  async checkLimit(key: string, config: RateLimitConfig): Promise<{ allowed: boolean; remaining: number }> {
    const now = Date.now();
    const windowMs = 60000; // 1 minute
    const windowStart = now - windowMs;
    const redisKey = `ratelimit:${key}`;

    // Redis transaction using multi to perform sliding window check
    const multi = this.redis.multi();
    
    // Remove all requests older than the window
    multi.zremrangebyscore(redisKey, 0, windowStart);
    
    // Count remaining requests in the window
    multi.zcard(redisKey);
    
    const results = await multi.exec();
    if (!results) {
      throw new Error('Failed to execute rate limit transaction');
    }

    const currentCount = results[1][1] as number;
    
    if (currentCount >= config.requestsPerMinute) {
      // Limit exceeded
      return { allowed: false, remaining: 0 };
    }

    // Add current request timestamp to the sorted set
    const addMulti = this.redis.multi();
    addMulti.zadd(redisKey, now.toString(), `${now}-${Math.random()}`); // value needs to be unique if timestamps collide
    // Set expiry to automatically clean up the key if inactive
    addMulti.expire(redisKey, 60);
    await addMulti.exec();

    return { allowed: true, remaining: config.requestsPerMinute - currentCount - 1 };
  }
}
