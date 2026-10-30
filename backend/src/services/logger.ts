export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

const LOG_LEVEL_ORDER: Record<LogLevel, number> = {
  DEBUG: 10,
  INFO: 20,
  WARN: 30,
  ERROR: 40,
};

const currentLevel: LogLevel = (process.env.LOG_LEVEL?.toUpperCase() as LogLevel) ?? "INFO";
const isProduction = process.env.NODE_ENV === "production";

export interface LogContext {
  requestId?: string;
  adminKey?: string;
  assetCode?: string;
  target?: string;
  [key: string]: unknown;
}

export class Logger {
  private context: LogContext;

  constructor(context: LogContext = {}) {
    this.context = context;
  }

  public withContext(additionalContext: LogContext): Logger {
    return new Logger({ ...this.context, ...additionalContext });
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_ORDER[level] >= LOG_LEVEL_ORDER[currentLevel];
  }

  private formatMessage(level: LogLevel, message: string, meta?: Record<string, unknown>): string {
    const payload = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...this.context,
      ...meta,
    };

    if (isProduction) {
      return JSON.stringify(payload);
    }

    const reqStr = this.context.requestId ? `[${this.context.requestId}] ` : "";
    const metaStr = meta && Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
    return `[${payload.timestamp}] ${level.padEnd(5)} ${reqStr}${message}${metaStr}`;
  }

  public debug(message: string, meta?: Record<string, unknown>): void {
    if (this.shouldLog("DEBUG")) {
      console.debug(this.formatMessage("DEBUG", message, meta));
    }
  }

  public info(message: string, meta?: Record<string, unknown>): void {
    if (this.shouldLog("INFO")) {
      console.info(this.formatMessage("INFO", message, meta));
    }
  }

  public warn(message: string, meta?: Record<string, unknown>): void {
    if (this.shouldLog("WARN")) {
      console.warn(this.formatMessage("WARN", message, meta));
    }
  }

  public error(message: string, error?: Error | unknown, meta?: Record<string, unknown>): void {
    if (this.shouldLog("ERROR")) {
      const errMeta: Record<string, unknown> = { ...meta };
      if (error instanceof Error) {
        errMeta.errorName = error.name;
        errMeta.errorMessage = error.message;
        errMeta.stack = error.stack;
      } else if (error) {
        errMeta.rawError = error;
      }
      console.error(this.formatMessage("ERROR", message, errMeta));
    }
  }
}

export const logger = new Logger();
