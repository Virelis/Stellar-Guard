import { Request, Response, NextFunction } from "express";
import { logger } from "../services/logger";

const blockedIps = new Set<string>();

const initialBlocked = process.env.BLOCKED_IPS ?? "";
if (initialBlocked) {
  initialBlocked.split(",").forEach((ip) => {
    const trimmed = ip.trim();
    if (trimmed) blockedIps.add(trimmed);
  });
}

export function blockIp(ip: string): void {
  if (ip && ip.trim()) {
    blockedIps.add(ip.trim());
    logger.info(`[IPFilter] Blocked IP: ${ip}`);
  }
}

export function unblockIp(ip: string): boolean {
  const deleted = blockedIps.delete(ip.trim());
  if (deleted) {
    logger.info(`[IPFilter] Unblocked IP: ${ip}`);
  }
  return deleted;
}

export function isIpBlocked(ip: string): boolean {
  return blockedIps.has(ip.trim());
}

export function getBlockedIps(): string[] {
  return Array.from(blockedIps);
}

export function ipFilterMiddleware(req: Request, res: Response, next: NextFunction): void {
  const clientIp = (req.ip || req.socket.remoteAddress || "").replace(/^::ffff:/, "");

  if (clientIp && isIpBlocked(clientIp)) {
    logger.warn(`[IPFilter] Rejected request from sanctioned/blocked IP: ${clientIp} (${req.method} ${req.path})`);
    res.status(403).json({
      error: "Forbidden",
      message: "Access from this network address is restricted under compliance policy",
    });
    return;
  }

  next();
}
