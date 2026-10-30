import { Request, Response, NextFunction } from "express";

interface RateLimitRecord {
  timestamps: number[];
}

export function createRateLimiter(options: {
  windowMs: number;
  maxRequests: number;
  message?: string;
}) {
  const store = new Map<string, RateLimitRecord>();

  // Periodically clean up stale client entries every 5 minutes
  setInterval(() => {
    const cutoff = Date.now() - options.windowMs;
    for (const [ip, record] of store.entries()) {
      record.timestamps = record.timestamps.filter((ts) => ts > cutoff);
      if (record.timestamps.length === 0) {
        store.delete(ip);
      }
    }
  }, 300000).unref();

  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();
    const cutoff = now - options.windowMs;

    let record = store.get(ip);
    if (!record) {
      record = { timestamps: [] };
      store.set(ip, record);
    }

    record.timestamps = record.timestamps.filter((ts) => ts > cutoff);

    const remaining = Math.max(0, options.maxRequests - record.timestamps.length);
    const resetSeconds = Math.ceil((options.windowMs - (now - (record.timestamps[0] || now))) / 1000);

    res.setHeader("RateLimit-Limit", options.maxRequests);
    res.setHeader("RateLimit-Remaining", remaining);
    res.setHeader("RateLimit-Reset", resetSeconds);

    if (record.timestamps.length >= options.maxRequests) {
      res.setHeader("Retry-After", resetSeconds);
      res.status(429).json({
        error: "Too Many Requests",
        message: options.message ?? `Rate limit exceeded. Try again in ${resetSeconds} seconds.`,
        retryAfterSeconds: resetSeconds,
      });
      return;
    }

    record.timestamps.push(now);
    next();
  };
}

export const generalRateLimiter = createRateLimiter({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? "60000", 10),
  maxRequests: parseInt(process.env.RATE_LIMIT_MAX ?? "100", 10),
});

export const strictVoteRateLimiter = createRateLimiter({
  windowMs: 60000,
  maxRequests: 30,
  message: "Too many governance vote attempts from this address. Please wait.",
});
