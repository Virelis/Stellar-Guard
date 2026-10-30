import { Router, Request, Response } from "express";
import { horizonMonitor } from "../services/horizonMonitor";
import { computeTransferAnalytics } from "../services/analytics";
import { listProposals } from "../services/voteStore";
import { queryAuditLogs } from "../services/auditService";

export const analyticsRouter = Router();

analyticsRouter.get("/transfers", (_req: Request, res: Response) => {
  const transfers = horizonMonitor.getTransfers();
  const report = computeTransferAnalytics(transfers);
  res.status(200).json({
    success: true,
    ...report,
  });
});

analyticsRouter.get("/governance", (_req: Request, res: Response) => {
  const proposals = listProposals();
  const auditSummary = queryAuditLogs({ limit: 100 });

  const eventCounts: Record<string, number> = {};
  for (const log of auditSummary.logs) {
    eventCounts[log.eventType] = (eventCounts[log.eventType] ?? 0) + 1;
  }

  res.status(200).json({
    success: true,
    activeProposalsCount: proposals.length,
    totalAuditEntries: auditSummary.total,
    eventsByType: eventCounts,
    timestamp: new Date().toISOString(),
  });
});
