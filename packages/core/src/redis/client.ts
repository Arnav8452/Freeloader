import Redis from 'ioredis';

export class RedisClient {
  private static instance: Redis;

  static getInstance(): Redis {
    if (!this.instance) {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      this.instance = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
      });

      this.instance.on('error', (err) => {
        console.error('[Freeloader] Redis connection error:', err);
      });
      
      this.instance.on('connect', () => {
        console.log('[Freeloader] Connected to Redis');
      });
    }

    return this.instance;
  }

  static async quit(): Promise<void> {
    if (this.instance) {
      await this.instance.quit();
    }
  }
}
