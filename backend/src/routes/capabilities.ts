import { Router, Request, Response } from "express";
import { getActiveNetwork } from "../services/networkManager";

export const capabilitiesRouter = Router();

capabilitiesRouter.get("/capabilities", (_req: Request, res: Response) => {
  const active = getActiveNetwork();
  const contractId = process.env.FREEZE_CONTRACT_ID ?? "";

  res.status(200).json({
    version: "1.0.0",
    name: "Stellar-Guard Governance Backend",
    network: {
      name: active.name,
      isTestnet: active.isTestnet,
      horizonUrl: active.horizonUrl,
      sorobanRpcUrl: active.sorobanRpcUrl,
      networkPassphrase: active.networkPassphrase,
      blockExplorerUrl: active.blockExplorerUrl,
    },
    contract: {
      contractId,
      isConfigured: contractId.length > 0,
    },
    features: {
      sseEventStreaming: true,
      xdrDecoding: true,
      persistentAuditTrail: true,
      webhooks: true,
      slidingRateLimiting: true,
      prometheusMetrics: true,
      databaseBackups: true,
    },
    supportedAssets: ["USDC", "EURC", "AUDD", "ARST", "BRLA", "NGNT", "XLM"],
    uptimeSeconds: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});
