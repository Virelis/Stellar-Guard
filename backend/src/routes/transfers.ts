import { Router, Request, Response } from "express";
import { horizonMonitor } from "../services/horizonMonitor";

export const transfersRouter = Router();

// GET /api/transfers — returns recent payment stream
transfersRouter.get("/", (_req: Request, res: Response) => {
  res.json(horizonMonitor.getTransfers());
});

// GET /api/transfers/asset/:code — filter by asset code
transfersRouter.get("/asset/:code", (req: Request, res: Response) => {
  const code = req.params.code.toUpperCase();
  const filtered = horizonMonitor.getTransfers().filter((t) => t.asset === code);
  res.json(filtered);
});

// GET /api/transfers/account/:address — filter by source or destination account
transfersRouter.get("/account/:address", (req: Request, res: Response) => {
  const addr = req.params.address;
  const filtered = horizonMonitor.getTransfers().filter((t) => t.from === addr || t.to === addr);
  res.json(filtered);
});

// GET /api/transfers/filter — advanced multi-field query with pagination
transfersRouter.get("/filter", (req: Request, res: Response) => {
  const account = typeof req.query.account === "string" ? req.query.account : undefined;
  const asset = typeof req.query.asset === "string" ? req.query.asset.toUpperCase() : undefined;
  const minAmount = req.query.minAmount ? parseFloat(req.query.minAmount as string) : undefined;
  const maxAmount = req.query.maxAmount ? parseFloat(req.query.maxAmount as string) : undefined;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
  const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

  let all = horizonMonitor.getTransfers();

  if (account) {
    all = all.filter((t) => t.from === account || t.to === account);
  }

  if (asset) {
    all = all.filter((t) => t.asset === asset);
  }

  if (minAmount !== undefined && !isNaN(minAmount)) {
    all = all.filter((t) => t.amount >= minAmount);
  }

  if (maxAmount !== undefined && !isNaN(maxAmount)) {
    all = all.filter((t) => t.amount <= maxAmount);
  }

  const total = all.length;
  const paginated = all.slice(offset, offset + limit);

  res.status(200).json({
    success: true,
    total,
    count: paginated.length,
    limit,
    offset,
    transfers: paginated,
  });
});
