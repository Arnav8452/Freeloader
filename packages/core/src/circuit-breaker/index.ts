import { CacheManager } from '../cache/CacheManager';

export enum CircuitBreakerState {
  CLOSED = 'CLOSED',       // Normal operation, routing requests freely
  OPEN = 'OPEN',           // Provider is failing, block all requests
  HALF_OPEN = 'HALF_OPEN'  // Probation period, allow 1 request to test if provider recovered
}

export interface CircuitBreakerConfig {
  failureThreshold: number; // e.g. 5 failures
  recoveryTimeoutMs: number; // e.g. 30000ms (30s) before going HALF_OPEN
}

export class CircuitBreaker {
  private cache = CacheManager.getInstance();

  constructor(
    private providerName: string,
    private config: CircuitBreakerConfig = { failureThreshold: 5, recoveryTimeoutMs: 30000 }
  ) {}

  private getFailureKey(): string {
    return `cb:${this.providerName}:failures`;
  }

  private getStateKey(): string {
    return `cb:${this.providerName}:state`;
  }

  /**
   * Retrieves the current state of the circuit breaker.
   * Handles transition from OPEN to HALF_OPEN if recovery timeout has passed.
   */
  async getState(): Promise<CircuitBreakerState> {
    const state = await this.cache.get(this.getStateKey());

    if (!state) {
      return CircuitBreakerState.CLOSED;
    }

    if (state === CircuitBreakerState.OPEN) {
      // Check if we should transition to HALF_OPEN
      const failuresTTL = await this.cache.pttl(this.getFailureKey());
      if (failuresTTL <= 0) {
        // Recovery timeout passed, transition to HALF_OPEN
        await this.cache.set(this.getStateKey(), CircuitBreakerState.HALF_OPEN);
        return CircuitBreakerState.HALF_OPEN;
      }
    }

    return state as CircuitBreakerState;
  }

  /**
   * Should be called before attempting a request.
   * Throws an error if the circuit is OPEN.
   */
  async acquireTicket(): Promise<void> {
    const state = await this.getState();

    if (state === CircuitBreakerState.OPEN) {
      throw new Error(`Circuit breaker is OPEN for provider: ${this.providerName}`);
    }

    if (state === CircuitBreakerState.HALF_OPEN) {
      // In half-open, we only allow one ticket at a time.
      // We can use a simple atomic flag to ensure only one probe request goes through.
      const probeFlagKey = `cb:${this.providerName}:probe`;
      const acquired = await this.cache.setNX(probeFlagKey, '1', this.config.recoveryTimeoutMs);
      
      if (!acquired) {
         throw new Error(`Circuit breaker is HALF_OPEN for provider: ${this.providerName}, probe request already dispatched.`);
      }
    }
  }

  /**
   * Should be called when a request succeeds.
   * Resets the failure counter and closes the circuit if it was HALF_OPEN.
   */
  async recordSuccess(): Promise<void> {
    const state = await this.getState();
    
    if (state === CircuitBreakerState.HALF_OPEN) {
      console.log(`[CircuitBreaker] Provider ${this.providerName} recovered. Closing circuit.`);
      await this.cache.delete(this.getStateKey());
      await this.cache.delete(`cb:${this.providerName}:probe`);
    }

    // Always clear failures on success
    await this.cache.delete(this.getFailureKey());
  }

  /**
   * Should be called when a request fails.
   * Increments the failure counter. Opens the circuit if threshold is reached.
   */
  async recordFailure(): Promise<void> {
    const state = await this.getState();

    if (state === CircuitBreakerState.HALF_OPEN) {
      // Probe failed, immediately transition back to OPEN
      console.warn(`[CircuitBreaker] Probe request failed for ${this.providerName}. Re-opening circuit.`);
      await this.cache.set(this.getStateKey(), CircuitBreakerState.OPEN);
      // Restart the recovery timer
      await this.cache.set(this.getFailureKey(), this.config.failureThreshold.toString(), this.config.recoveryTimeoutMs / 1000);
      await this.cache.delete(`cb:${this.providerName}:probe`);
      return;
    }

    // Normal CLOSED state handling
    const failures = await this.cache.incrementWithPttl(this.getFailureKey(), this.config.recoveryTimeoutMs);

    if (failures >= this.config.failureThreshold) {
      console.warn(`[CircuitBreaker] Failure threshold reached for ${this.providerName}. Opening circuit.`);
      await this.cache.set(this.getStateKey(), CircuitBreakerState.OPEN);
      // Restart the failures key TTL to act as the recovery timeout clock
      await this.cache.set(this.getFailureKey(), this.config.failureThreshold.toString(), this.config.recoveryTimeoutMs / 1000);
    }
  }

  /**
   * Returns a summary of all active (OPEN or HALF_OPEN) circuit breakers across the gateway.
   */
  static async getActiveBreakers(): Promise<{ provider: string, state: CircuitBreakerState }[]> {
    const cache = CacheManager.getInstance();
    const keys = await cache.keys('cb:*:state');
    
    if (keys.length === 0) return [];
    
    const states = await cache.mget(keys);
    const activeBreakers: { provider: string, state: CircuitBreakerState }[] = [];
    
    for (let i = 0; i < keys.length; i++) {
      const state = states[i] as CircuitBreakerState | null;
      if (state && (state === CircuitBreakerState.OPEN || state === CircuitBreakerState.HALF_OPEN)) {
        const providerName = keys[i].split(':')[1];
        activeBreakers.push({ provider: providerName, state });
      }
    }
    
    return activeBreakers;
  }
}
