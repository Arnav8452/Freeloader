export interface CacheProvider {
  // Standard Key/Value
  get(key: string): Promise<any | null>;
  set(key: string, value: any, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
  disconnect(): Promise<void>;

  // Circuit Breaker Operations
  setNX(key: string, value: any, ttlMs: number): Promise<boolean>;
  incrementWithPttl(key: string, ttlMs: number): Promise<number>; // Incr, and if it's 1, set pexpire
  pttl(key: string): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  mget(keys: string[]): Promise<any[]>;

  // Rate Limiting (Sliding Window abstraction)
  recordRateLimitHit(key: string, timestamp: number, windowMs: number): Promise<number>;

  // Metrics Operations
  increment(key: string, amount?: number): Promise<number>;
  incrementFloat(key: string, amount: number): Promise<number>;
  listPush(key: string, value: any, maxLen: number): Promise<void>;
  listRange(key: string, start: number, end: number): Promise<any[]>;
}
