import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

declare global {
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const existingId = req.header("X-Request-ID");
  const requestId = existingId && existingId.trim().length > 0 ? existingId : crypto.randomUUID();

  req.id = requestId;
  res.setHeader("X-Request-ID", requestId);

  next();
}
