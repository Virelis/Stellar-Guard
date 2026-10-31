/**
 * Stellar-Guard Environment Validator
 * Pre-flight diagnostic tool to verify environment configuration before process launch.
 */

import { StrKey } from "@stellar/stellar-sdk";

export interface EnvValidationReport {
  valid: boolean;
  warnings: string[];
  errors: string[];
  checkedKeys: Record<string, string>;
}

export function validateEnvironment(env: NodeJS.ProcessEnv = process.env): EnvValidationReport {
  const warnings: string[] = [];
  const errors: string[] = [];
  const checkedKeys: Record<string, string> = {};

  // 1. Port
  const port = env.PORT ? parseInt(env.PORT, 10) : 4000;
  if (isNaN(port) || port < 1 || port > 65535) {
    errors.push(`PORT must be between 1 and 65535, received: '${env.PORT}'`);
  } else {
    checkedKeys["PORT"] = String(port);
  }

  // 2. Horizon URL
  const horizonUrl = env.HORIZON_URL || "https://horizon-testnet.stellar.org";
  try {
    new URL(horizonUrl);
    checkedKeys["HORIZON_URL"] = horizonUrl;
  } catch {
    errors.push(`HORIZON_URL is not a valid URL: '${horizonUrl}'`);
  }

  // 3. Soroban RPC URL
  const sorobanRpcUrl = env.SOROBAN_RPC_URL || "https://soroban-testnet.stellar.org";
  try {
    new URL(sorobanRpcUrl);
    checkedKeys["SOROBAN_RPC_URL"] = sorobanRpcUrl;
  } catch {
    errors.push(`SOROBAN_RPC_URL is not a valid URL: '${sorobanRpcUrl}'`);
  }

  // 4. Contract ID (Optional in dev, but if provided must be C... StrKey)
  const contractId = env.FREEZE_CONTRACT_ID;
  if (contractId) {
    if (contractId.startsWith("C") && contractId.length === 56) {
      checkedKeys["FREEZE_CONTRACT_ID"] = contractId;
    } else {
      warnings.push(`FREEZE_CONTRACT_ID should be a 56-character Soroban contract address starting with 'C', received: '${contractId}'`);
    }
  } else {
    warnings.push("FREEZE_CONTRACT_ID is not configured. Smart contract queries will run in mock mode.");
  }

  // 5. JWT Secret
  const jwtSecret = env.JWT_SECRET;
  if (jwtSecret && jwtSecret.length < 32) {
    warnings.push("JWT_SECRET is shorter than 32 characters; recommend at least 256-bit entropy in production.");
  }

  // 6. Allowed Origin
  const allowedOrigin = env.ALLOWED_ORIGIN || "http://localhost:3000";
  checkedKeys["ALLOWED_ORIGIN"] = allowedOrigin;

  return {
    valid: errors.length === 0,
    warnings,
    errors,
    checkedKeys,
  };
}

if (require.main === module) {
  const report = validateEnvironment();
  console.log("==============================================");
  console.log(" Stellar-Guard Pre-flight Environment Check   ");
  console.log("==============================================");

  for (const [key, val] of Object.entries(report.checkedKeys)) {
    console.log(` [OK] ${key} = ${val}`);
  }

  for (const warn of report.warnings) {
    console.warn(` [WARN] ${warn}`);
  }

  for (const err of report.errors) {
    console.error(` [ERROR] ${err}`);
  }

  console.log("----------------------------------------------");
  if (!report.valid) {
    console.error("Environment verification failed with errors.");
    process.exit(1);
  } else {
    console.log("Environment configuration verified successfully.");
    process.exit(0);
  }
}
