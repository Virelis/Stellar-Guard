import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

export type Role = "admin" | "auditor" | "proposer";

export interface AuthPayload {
  adminKey: string;
  role: Role;
  iat: number;
  exp: number;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthPayload;
    }
  }
}

const DEV_SECRET = "stellar-guard-dev-secret-key-at-least-32-chars-long";
const JWT_SECRET = process.env.JWT_SECRET ?? DEV_SECRET;

if (
  process.env.NODE_ENV === "production" &&
  (!process.env.JWT_SECRET || process.env.JWT_SECRET === DEV_SECRET)
) {
  throw new Error(
    "FATAL: JWT_SECRET must be explicitly set to a cryptographically secure string in production"
  );
}

const isProduction = process.env.NODE_ENV === "production";
const isAuthEnforced = isProduction || process.env.AUTH_REQUIRED === "true";

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return Buffer.from(base64, "base64").toString("utf8");
}

export function signAuthToken(
  adminKey: string,
  role: Role = "admin",
  expiresInSeconds: number = 86400
): string {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload: AuthPayload = {
    adminKey,
    role,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export function verifyAuthToken(token: string): AuthPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, signature] = parts;
    const expectedSignature = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

    const sigBuf = Buffer.from(signature, "utf8");
    const expBuf = Buffer.from(expectedSignature, "utf8");
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    const payload: AuthPayload = JSON.parse(base64UrlDecode(encodedPayload));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) return null;

    return payload;
  } catch {
    return null;
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    if (isAuthEnforced) {
      res
        .status(401)
        .json({ error: "Unauthorized", message: "Missing or invalid Authorization header" });
      return;
    }
    // In dev / non-strict mode, pass through
    return next();
  }

  const token = authHeader.substring(7);
  const payload = verifyAuthToken(token);
  if (!payload) {
    res.status(401).json({ error: "Unauthorized", message: "Invalid or expired token" });
    return;
  }

  req.auth = payload;
  next();
}

export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!isAuthEnforced && !req.auth) {
      return next();
    }
    if (!req.auth || !allowedRoles.includes(req.auth.role)) {
      res
        .status(403)
        .json({ error: "Forbidden", message: "Insufficient permissions for this operation" });
      return;
    }
    next();
  };
}
