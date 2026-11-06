import { Router, Request, Response } from "express";
import axios from "axios";
import { getActiveNetwork, switchNetwork, getAllNetworks } from "../services/networkManager";
import { authMiddleware, requireRole } from "../middleware/auth";

export const networkRouter = Router();

networkRouter.get("/", async (_req: Request, res: Response) => {
  const active = getActiveNetwork();
  const start = Date.now();
  let horizonLatencyMs = -1;
  let latestLedger = -1;
  let protocolVersion = -1;
  let status = "online";

  try {
    const { data } = await axios.get(active.horizonUrl, { timeout: 4000 });
    horizonLatencyMs = Date.now() - start;
    latestLedger = data.core_latest_ledger ?? data.history_latest_ledger ?? -1;
    protocolVersion = data.current_protocol_version ?? -1;
  } catch {
    status = "degraded";
  }

  res.status(200).json({
    status,
    network: active.name,
    isTestnet: active.isTestnet,
    horizonUrl: active.horizonUrl,
    sorobanRpcUrl: active.sorobanRpcUrl,
    networkPassphrase: active.networkPassphrase,
    blockExplorerUrl: active.blockExplorerUrl,
    telemetry: {
      horizonLatencyMs,
      latestLedger,
      protocolVersion,
    },
  });
});

networkRouter.get("/all", (_req: Request, res: Response) => {
  res.status(200).json({
    activeNetwork: getActiveNetwork().name,
    availableNetworks: getAllNetworks(),
  });
});

networkRouter.post(
  "/switch",
  authMiddleware,
  requireRole("admin"),
  (req: Request, res: Response) => {
    const { network } = req.body;
    if (!network || typeof network !== "string") {
      res.status(400).json({ error: "Missing required field 'network'" });
      return;
    }

    try {
      const updated = switchNetwork(network);
      res.status(200).json({
        success: true,
        message: `Active network switched to '${updated.name}'`,
        network: updated,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
);
