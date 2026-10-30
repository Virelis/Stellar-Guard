import { Request, Response, NextFunction } from "express";

export function securityHeadersMiddleware(_req: Request, res: Response, next: NextFunction): void {
  // Prevent MIME type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Prevent framing / clickjacking
  res.setHeader("X-Frame-Options", "DENY");

  // Prevent cross-site scripting
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Referrer policy
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Restrict sensitive browser features
  res.setHeader("Permissions-Policy", "geolocation=(), camera=(), microphone=()");

  // Strict Transport Security (HSTS)
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");

  // Remove Express fingerprint
  res.removeHeader("X-Powered-By");

  next();
}
