interface CacheItem<T> {
  value: T;
  expiresAt: number;
}

export class TtlCache {
  private store = new Map<string, CacheItem<any>>();
  private inflight = new Map<string, Promise<any>>();
  private hits = 0;
  private misses = 0;

  constructor(private defaultTtlMs = 60000) {
    // Sweep expired items every 60 seconds
    setInterval(() => {
      this.sweep();
    }, 60000).unref();
  }

  public get<T>(key: string): T | null {
    const item = this.store.get(key);
    if (!item) {
      this.misses++;
      return null;
    }
    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      this.misses++;
      return null;
    }
    this.hits++;
    return item.value as T;
  }

  public set<T>(key: string, value: T, ttlMs?: number): void {
    const ttl = ttlMs ?? this.defaultTtlMs;
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttl,
    });
  }

  public async getOrSet<T>(key: string, factory: () => Promise<T>, ttlMs?: number): Promise<T> {
    const existing = this.get<T>(key);
    if (existing !== null) {
      return existing;
    }

    // Cache stampede guard: join existing in-flight promise if present
    const inflightPromise = this.inflight.get(key);
    if (inflightPromise) {
      return inflightPromise as Promise<T>;
    }

    const promise = (async () => {
      try {
        const val = await factory();
        this.set(key, val, ttlMs);
        return val;
      } finally {
        this.inflight.delete(key);
      }
    })();

    this.inflight.set(key, promise);
    return promise;
  }

  public delete(key: string): boolean {
    return this.store.delete(key);
  }

  public clear(): void {
    this.store.clear();
    this.inflight.clear();
    this.hits = 0;
    this.misses = 0;
  }

  public getStats() {
    const total = this.hits + this.misses;
    return {
      size: this.store.size,
      hits: this.hits,
      misses: this.misses,
      hitRatio: total > 0 ? (this.hits / total).toFixed(4) : "0.0000",
    };
  }

  private sweep(): void {
    const now = Date.now();
    for (const [key, item] of this.store.entries()) {
      if (now > item.expiresAt) {
        this.store.delete(key);
      }
    }
  }
}

export const memoryCache = new TtlCache();
