import Redis from 'ioredis';
import { CacheProvider } from './CacheProvider';

export class RedisCache implements CacheProvider {
  private client: Redis;

  constructor(url?: string) {
    this.client = new Redis(url || process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
    });
    
    this.client.on('error', (err) => {
      console.error('[Freeloader Redis Error]', err);
    });
  }

  async get(key: string): Promise<any | null> {
    const data = await this.client.get(key);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return data; // Not JSON
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    if (ttlSeconds) {
      await this.client.set(key, stringValue, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, stringValue);
    }
  }

  async delete(key: string): Promise<void> {
    await this.client.del(key);
  }

  async disconnect(): Promise<void> {
    await this.client.quit();
  }

  async setNX(key: string, value: any, ttlMs: number): Promise<boolean> {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    const result = await this.client.set(key, stringValue, 'PX', ttlMs, 'NX');
    return result === 'OK';
  }

  async incrementWithPttl(key: string, ttlMs: number): Promise<number> {
    const failures = await this.client.incr(key);
    if (failures === 1) {
      await this.client.pexpire(key, ttlMs);
    }
    return failures;
  }

  async pttl(key: string): Promise<number> {
    return this.client.pttl(key);
  }

  async keys(pattern: string): Promise<string[]> {
    return this.client.keys(pattern);
  }

  async mget(keys: string[]): Promise<any[]> {
    if (keys.length === 0) return [];
    const values = await this.client.mget(...keys);
    return values.map(val => {
      if (!val) return null;
      try {
        return JSON.parse(val);
      } catch {
        return val;
      }
    });
  }

  async recordRateLimitHit(key: string, timestamp: number, windowMs: number): Promise<number> {
    const redisKey = `ratelimit:${key}`;
    const windowStart = timestamp - windowMs;
    
    const multi = this.client.multi();
    
    // Remove all requests older than the window
    multi.zremrangebyscore(redisKey, 0, windowStart);
    
    // Count remaining requests in the window
    multi.zcard(redisKey);
    
    const results = await multi.exec();
    if (!results) {
      throw new Error('Failed to execute rate limit transaction');
    }

    const currentCount = results[1][1] as number;
    
    // Add current request timestamp to the sorted set
    const addMulti = this.client.multi();
    addMulti.zadd(redisKey, timestamp.toString(), `${timestamp}-${Math.random()}`);
    addMulti.expire(redisKey, Math.ceil(windowMs / 1000) + 10);
    await addMulti.exec();

    return currentCount;
  }

  async increment(key: string, amount: number = 1): Promise<number> {
    if (amount === 1) {
       return this.client.incr(key);
    }
    return this.client.incrby(key, amount);
  }

  async incrementFloat(key: string, amount: number): Promise<number> {
    const result = await this.client.incrbyfloat(key, amount);
    return parseFloat(result);
  }

  async listPush(key: string, value: any, maxLen: number): Promise<void> {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    const multi = this.client.multi();
    multi.lpush(key, stringValue);
    multi.ltrim(key, 0, maxLen - 1);
    await multi.exec();
  }

  async listRange(key: string, start: number, end: number): Promise<any[]> {
    const values = await this.client.lrange(key, start, end);
    return values.map(val => {
      try {
        return JSON.parse(val);
      } catch {
        return val;
      }
    });
  }
}
