import { Request, Response, NextFunction } from "express";
import { logger } from "../services/logger";

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown;
}

export function errorHandler(
  err: ApiError | any,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const isProduction = process.env.NODE_ENV === "production";
  let statusCode = err.statusCode || (typeof err.status === "number" ? err.status : 500);
  let errorName = err.code || err.name || "InternalServerError";
  let message = err.message || "An unexpected internal error occurred";

  // Map Stellar Horizon specific transaction errors
  const txCode = err.response?.data?.extras?.result_codes?.transaction;
  if (txCode === "tx_bad_auth") {
    statusCode = 403;
    errorName = "UnauthorizedFreezeAttempt";
    message = "Signer is not authorized to execute freeze on this contract";
  } else if (txCode) {
    statusCode = 400;
    errorName = `StellarTxError_${txCode}`;
  }

  logger.error(`[ErrorHandler] ${req.method} ${req.path} - ${statusCode} ${errorName}: ${message}`, err, {
    path: req.path,
    method: req.method,
    statusCode,
  });

  const responseBody: Record<string, unknown> = {
    success: false,
    error: errorName,
    message,
    timestamp: new Date().toISOString(),
  };

  if (!isProduction && err.stack) {
    responseBody.stack = err.stack;
  }
  if (err.details) {
    responseBody.details = err.details;
  }

  res.status(statusCode).json(responseBody);
}
