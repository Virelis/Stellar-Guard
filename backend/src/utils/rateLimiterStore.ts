/**
 * Pluggable Sliding-Window Rate Limiter Store
 * Supports in-memory tracking with sliding timestamp windows and interface for Redis clustering.
 */

export interface RateLimitResult {
  allowed: boolean;
  count: number;
  remaining: number;
  resetMs: number;
}

export interface IRateLimiterStore {
  consume(key: string, limit: number, windowMs: number): Promise<RateLimitResult>;
  reset(key: string): Promise<void>;
}

export class MemoryRateLimiterStore implements IRateLimiterStore {
  private buckets = new Map<string, number[]>();

  public async consume(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = now - windowMs;

    let timestamps = this.buckets.get(key) || [];
    // Filter timestamps within current sliding window
    timestamps = timestamps.filter((t) => t > windowStart);

    if (timestamps.length >= limit) {
      const oldest = timestamps[0];
      const resetMs = Math.max(0, oldest + windowMs - now);
      this.buckets.set(key, timestamps);
      return {
        allowed: false,
        count: timestamps.length,
        remaining: 0,
        resetMs,
      };
    }

    timestamps.push(now);
    this.buckets.set(key, timestamps);

    return {
      allowed: true,
      count: timestamps.length,
      remaining: limit - timestamps.length,
      resetMs: windowMs,
    };
  }

  public async reset(key: string): Promise<void> {
    this.buckets.delete(key);
  }

  public clear(): void {
    this.buckets.clear();
  }
}

export const defaultRateLimiterStore = new MemoryRateLimiterStore();

