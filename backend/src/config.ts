import "dotenv/config";

export interface AppConfig {
  port: number;
  nodeEnv: "development" | "production" | "test";
  allowedOrigin: string;
  horizonUrl: string;
  sorobanRpcUrl: string;
  freezeContractId: string;
  networkPassphrase: string;
  jwtSecret: string;
  authRequired: boolean;
  rateLimitWindowMs: number;
  rateLimitMax: number;
  logLevel: "DEBUG" | "INFO" | "WARN" | "ERROR";
}

function parseEnvNumber(key: string, defaultValue: number): number {
  const val = process.env[key];
  if (!val) return defaultValue;
  const parsed = parseInt(val, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a valid number, got '${val}'`);
  }
  return parsed;
}

function parseEnvUrl(key: string, defaultValue: string): string {
  const val = process.env[key] ?? defaultValue;
  try {
    new URL(val);
    return val;
  } catch {
    throw new Error(`Environment variable ${key} must be a valid URL, got '${val}'`);
  }
}

export function loadConfig(): AppConfig {
  const nodeEnv = (process.env.NODE_ENV ?? "development") as AppConfig["nodeEnv"];
  const port = parseEnvNumber("PORT", 4000);
  if (port < 1 || port > 65535) {
    throw new Error(`PORT must be between 1 and 65535, got ${port}`);
  }

  const horizonUrl = parseEnvUrl("HORIZON_URL", "https://horizon-testnet.stellar.org");
  const sorobanRpcUrl = parseEnvUrl("SOROBAN_RPC_URL", "https://soroban-testnet.stellar.org");
  const networkPassphrase = process.env.NETWORK_PASSPHRASE ?? "Test SDF Network ; September 2015";
  const freezeContractId = process.env.FREEZE_CONTRACT_ID ?? "";
  const allowedOrigin = process.env.ALLOWED_ORIGIN ?? "http://localhost:3000";
  const jwtSecret = process.env.JWT_SECRET ?? "stellar-guard-dev-secret-key-at-least-32-chars-long";
  const authRequired = process.env.AUTH_REQUIRED === "true";
  const rateLimitWindowMs = parseEnvNumber("RATE_LIMIT_WINDOW_MS", 60000);
  const rateLimitMax = parseEnvNumber("RATE_LIMIT_MAX", 100);

  const rawLogLevel = (process.env.LOG_LEVEL?.toUpperCase() ?? "INFO") as AppConfig["logLevel"];
  const validLogLevels: AppConfig["logLevel"][] = ["DEBUG", "INFO", "WARN", "ERROR"];
  const logLevel = validLogLevels.includes(rawLogLevel) ? rawLogLevel : "INFO";

  return {
    port,
    nodeEnv,
    allowedOrigin,
    horizonUrl,
    sorobanRpcUrl,
    freezeContractId,
    networkPassphrase,
    jwtSecret,
    authRequired,
    rateLimitWindowMs,
    rateLimitMax,
    logLevel,
  };
}

export const config = loadConfig();
