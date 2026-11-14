import cors from "cors";
import { Request, Response, NextFunction, RequestHandler } from "express";

export class CorsConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CorsConfigurationError";
  }
}

/**
 * Validates a single origin allowlist entry and returns its normalized `<scheme>://<host>[:<port>]` origin.
 * Rejects wildcard `*`, non-HTTP(S) schemes, credentials, paths, query strings, and fragments.
 */
export function normalizeAndValidateOriginUrl(entry: string): string {
  const trimmed = entry.trim();
  if (!trimmed) {
    throw new CorsConfigurationError("Empty origin entry is not valid in ALLOWED_ORIGIN");
  }

  if (trimmed === "*" || trimmed.includes("*")) {
    throw new CorsConfigurationError(
      `Wildcard origin '${trimmed}' is not permitted in ALLOWED_ORIGIN`
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new CorsConfigurationError(`Invalid URL '${trimmed}' in ALLOWED_ORIGIN`);
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new CorsConfigurationError(
      `Unsupported protocol '${parsed.protocol}' in ALLOWED_ORIGIN '${trimmed}' (expected http: or https:)`
    );
  }

  if (parsed.username || parsed.password) {
    throw new CorsConfigurationError(
      `Origin '${trimmed}' in ALLOWED_ORIGIN must not include credentials`
    );
  }

  if ((parsed.pathname && parsed.pathname !== "/") || parsed.search || parsed.hash) {
    throw new CorsConfigurationError(
      `Origin '${trimmed}' in ALLOWED_ORIGIN must not contain a path, query, or hash`
    );
  }

  return parsed.origin;
}

/**
 * Parses and validates `ALLOWED_ORIGIN`.
 * Refuses startup when `ALLOWED_ORIGIN` is empty in production, contains `*`, or has invalid URLs.
 */
export function parseAllowedOrigins(
  rawOrigin: string | undefined = process.env.ALLOWED_ORIGIN,
  nodeEnv: string | undefined = process.env.NODE_ENV
): string[] {
  const isProduction = nodeEnv === "production";

  if (rawOrigin === undefined || rawOrigin.trim().length === 0) {
    if (isProduction) {
      throw new CorsConfigurationError(
        "ALLOWED_ORIGIN must be explicitly configured with valid URL(s) in production"
      );
    }
    return ["http://localhost:3000"];
  }

  const parts = rawOrigin
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  if (parts.length === 0) {
    throw new CorsConfigurationError("ALLOWED_ORIGIN must contain at least one valid origin URL");
  }

  return Array.from(new Set(parts.map(normalizeAndValidateOriginUrl)));
}

export function createCorsMiddleware(options?: {
  rawOrigin?: string;
  nodeEnv?: string;
}): RequestHandler {
  const effectiveNodeEnv = options?.nodeEnv ?? process.env.NODE_ENV;
  const effectiveRawOrigin =
    options && "rawOrigin" in options ? options.rawOrigin : process.env.ALLOWED_ORIGIN;

  // Fail-fast at startup if configuration is invalid
  const allowedOrigins = parseAllowedOrigins(effectiveRawOrigin, effectiveNodeEnv);
  const allowedSet = new Set(allowedOrigins);

  const delegate = cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }
      return callback(null, origin);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID", "Accept"],
    exposedHeaders: [
      "X-Request-ID",
      "RateLimit-Limit",
      "RateLimit-Remaining",
      "RateLimit-Reset",
      "Retry-After",
    ],
    maxAge: 86400, // 24 hours preflight cache
    credentials: true,
  });

  return (req: Request, res: Response, next: NextFunction): void => {
    const origin = req.headers.origin;

    // Allow requests without an Origin header (e.g. mobile apps, curl, server-to-server)
    if (!origin) {
      delegate(req, res, next);
      return;
    }

    const isExplicitlyAllowed = allowedSet.has(origin);
    const isDevLocalhost =
      effectiveNodeEnv !== "production" && /^http:\/\/localhost(:\d+)?$/.test(origin);

    if (!isExplicitlyAllowed && !isDevLocalhost) {
      res.status(403).json({
        success: false,
        error: "ForbiddenOrigin",
        message: `Origin '${origin}' is not allowed by CORS policy`,
      });
      return;
    }

    delegate(req, res, next);
  };
}

export const corsMiddleware: RequestHandler = createCorsMiddleware();
