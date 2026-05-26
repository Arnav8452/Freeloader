import { CacheProvider } from './CacheProvider';
import { MemoryCache } from './MemoryCache';
import { RedisCache } from './RedisCache';

export class CacheManager {
  private static instance: CacheProvider | undefined;

  static getInstance(): CacheProvider {
    if (!this.instance) {
      const mode = process.env.CACHE_MODE || 'redis';
      if (mode === 'memory') {
        this.instance = new MemoryCache();
        console.log('[Freeloader] Initialized with Memory cache');
      } else {
        this.instance = new RedisCache(process.env.REDIS_URL);
        console.log('[Freeloader] Initialized with Redis cache');
      }
    }
    return this.instance;
  }

  static setInstance(provider: CacheProvider): void {
    this.instance = provider;
  }

  static async quit(): Promise<void> {
    if (this.instance) {
      await this.instance.disconnect();
      this.instance = undefined;
    }
  }
}
