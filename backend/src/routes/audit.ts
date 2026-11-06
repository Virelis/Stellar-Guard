import { Router, Request, Response } from "express";
import { queryAuditLogs } from "../services/auditService";
import { authMiddleware, requireRole } from "../middleware/auth";

export const auditRouter = Router();

auditRouter.get(["/", "/logs"], (req: Request, res: Response) => {
  const target = typeof req.query.target === "string" ? req.query.target : undefined;
  const eventType = typeof req.query.eventType === "string" ? req.query.eventType : undefined;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
  const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

  const results = queryAuditLogs({ target, eventType, limit, offset });
  const normalizedLogs = results.logs.map((l) => ({
    id: l.id,
    eventType: l.eventType,
    event_type: l.eventType,
    assetCode: l.assetCode,
    asset_code: l.assetCode,
    issuer: l.issuer,
    target: l.target,
    adminKey: l.adminKey,
    admin_key: l.adminKey,
    details: l.details,
    createdAt: l.createdAt,
    created_at: l.createdAt,
  }));

  if (req.path === "/logs") {
    res.status(200).json(normalizedLogs);
    return;
  }

  res.status(200).json({
    success: true,
    total: results.total,
    logs: normalizedLogs,
    limit,
    offset,
  });
});

auditRouter.get(
  "/export",
  authMiddleware,
  requireRole("admin", "auditor"),
  (req: Request, res: Response) => {
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
  }
);
