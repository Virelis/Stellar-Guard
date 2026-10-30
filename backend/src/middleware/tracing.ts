import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

declare global {
  namespace Express {
    interface Request {
      traceId?: string;
      spanId?: string;
    }
  }
}

export function tracingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const header = req.header("traceparent");
  let traceId: string;
  let spanId: string;

  if (header && /^00-[0-9a-f]{32}-[0-9a-f]{16}-[0-9a-f]{2}$/i.test(header)) {
    const parts = header.split("-");
    traceId = parts[1];
    spanId = crypto.randomBytes(8).toString("hex");
  } else {
    traceId = crypto.randomBytes(16).toString("hex");
    spanId = crypto.randomBytes(8).toString("hex");
  }

  req.traceId = traceId;
  req.spanId = spanId;

  const w3cTraceparent = `00-${traceId}-${spanId}-01`;
  res.setHeader("traceparent", w3cTraceparent);
  res.setHeader("x-trace-id", traceId);

  next();
}
