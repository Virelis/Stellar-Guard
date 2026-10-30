import { Router, Request, Response } from "express";
import { queryAuditLogs } from "../services/auditService";

export const auditRouter = Router();

auditRouter.get("/", (req: Request, res: Response) => {
  const target = typeof req.query.target === "string" ? req.query.target : undefined;
  const eventType = typeof req.query.eventType === "string" ? req.query.eventType : undefined;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
  const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

  const results = queryAuditLogs({ target, eventType, limit, offset });
  res.status(200).json({
    success: true,
    ...results,
    limit,
    offset,
  });
});

auditRouter.get("/export", (req: Request, res: Response) => {
  const target = typeof req.query.target === "string" ? req.query.target : undefined;
  const eventType = typeof req.query.eventType === "string" ? req.query.eventType : undefined;
  const { logs } = queryAuditLogs({ target, eventType, limit: 200, offset: 0 });

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", 'attachment; filename="stellar-guard-audit-trail.csv"');

  const headers = "id,eventType,assetCode,issuer,target,adminKey,details,createdAt\n";
  const rows = logs
    .map(
      (l) =>
        `"${l.id}","${l.eventType}","${l.assetCode ?? ""}","${l.issuer ?? ""}","${l.target ?? ""}","${l.adminKey ?? ""}","${(l.details ?? "").replace(/"/g, '""')}","${l.createdAt ?? ""}"`
    )
    .join("\n");

  res.send(headers + rows);
});
