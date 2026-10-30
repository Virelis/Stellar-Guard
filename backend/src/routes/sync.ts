import { Router, Request, Response } from "express";
import { syncTracker } from "../services/syncTracker";
import { getActiveNetwork } from "../services/networkManager";

export const syncRouter = Router();

syncRouter.get("/", async (_req: Request, res: Response) => {
  const network = getActiveNetwork();
  const status = await syncTracker.checkSync(network.horizonUrl);

  const estimatedLagSeconds = status.lagLedgers * 5; // ~5 seconds per Stellar ledger close

  res.status(200).json({
    network: network.name,
    ...status,
    estimatedLagSeconds,
    statusText: status.isSynced ? "SYNCED" : "CATCHING_UP",
  });
});
