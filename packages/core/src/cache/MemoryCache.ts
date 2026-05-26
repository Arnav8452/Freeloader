import { CacheProvider } from './CacheProvider';

export class MemoryCache implements CacheProvider {
  private store = new Map<string, { value: any; expiresAt?: number }>();

  private _get(key: string): any | null {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async get(key: string): Promise<any | null> {
    return this._get(key);
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const expiresAt = ttlSeconds ? Date.now() + (ttlSeconds * 1000) : undefined;
    this.store.set(key, { value, expiresAt });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async disconnect(): Promise<void> {
    this.store.clear();
  }

  async setNX(key: string, value: any, ttlMs: number): Promise<boolean> {
    const existing = this._get(key);
    if (existing !== null) {
      return false;
    }
    const expiresAt = Date.now() + ttlMs;
    this.store.set(key, { value, expiresAt });
    return true;
  }

  async incrementWithPttl(key: string, ttlMs: number): Promise<number> {
    let item = this._get(key);
    if (item === null) {
      item = 0;
    }
    const newValue = Number(item) + 1;
    
    // Only set expiry if it's a new item (similar to how redis incr works if we follow it up with pexpire on first incr)
    const existingEntry = this.store.get(key);
    let expiresAt = existingEntry?.expiresAt;
    
    if (newValue === 1 || !expiresAt) {
       expiresAt = Date.now() + ttlMs;
    }

    this.store.set(key, { value: newValue, expiresAt });
    return newValue;
  }

  async pttl(key: string): Promise<number> {
    const item = this.store.get(key);
    if (!item) return -2; // key does not exist
    if (!item.expiresAt) return -1; // key exists but has no associated expire
    const ttl = item.expiresAt - Date.now();
    if (ttl <= 0) {
      this.store.delete(key);
      return -2;
    }
    return ttl;
  }

  async keys(pattern: string): Promise<string[]> {
    // Basic wildcard matching (* only)
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    const matchedKeys: string[] = [];
    for (const key of this.store.keys()) {
      // Trigger expiration check
      if (this._get(key) !== null) {
        if (regex.test(key)) {
          matchedKeys.push(key);
        }
      }
    }
    return matchedKeys;
  }

  async mget(keys: string[]): Promise<any[]> {
    return keys.map(key => this._get(key));
  }

  async recordRateLimitHit(key: string, timestamp: number, windowMs: number): Promise<number> {
    const redisKey = `ratelimit:${key}`;
    let history: number[] = this._get(redisKey) || [];
    
    const windowStart = timestamp - windowMs;
    history = history.filter(ts => ts > windowStart);
    
    const currentCount = history.length;
    history.push(timestamp);
    
    // Set to expire a bit after the window
    this.store.set(redisKey, { value: history, expiresAt: Date.now() + windowMs + 1000 });
    
    return currentCount;
  }

  async increment(key: string, amount: number = 1): Promise<number> {
    let item = this._get(key);
    if (item === null) item = 0;
    const newValue = Number(item) + amount;
    
    const existingEntry = this.store.get(key);
    this.store.set(key, { value: newValue, expiresAt: existingEntry?.expiresAt });
    return newValue;
  }

  async incrementFloat(key: string, amount: number): Promise<number> {
    let item = this._get(key);
    if (item === null) item = 0;
    const newValue = parseFloat(item) + amount;
    
    const existingEntry = this.store.get(key);
    this.store.set(key, { value: newValue.toString(), expiresAt: existingEntry?.expiresAt });
    return newValue;
  }

  async listPush(key: string, value: any, maxLen: number): Promise<void> {
    let list: any[] = this._get(key) || [];
    list.unshift(value); // lpush adds to the head
    if (list.length > maxLen) {
      list = list.slice(0, maxLen);
    }
    const existingEntry = this.store.get(key);
    this.store.set(key, { value: list, expiresAt: existingEntry?.expiresAt });
  }

  async listRange(key: string, start: number, end: number): Promise<any[]> {
    const list: any[] = this._get(key) || [];
    // Handle typical redis list range semantics where -1 means the end
    const adjustedEnd = end === -1 || end >= list.length - 1 ? list.length : end + 1;
    return list.slice(start, adjustedEnd);
  }
}
