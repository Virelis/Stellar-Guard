import { Router, Request, Response } from "express";
import { runDatabaseMaintenance } from "../services/dbMaintenance";
import { recordAuditLog } from "../services/auditService";
import { authMiddleware, requireRole } from "../middleware/auth";

export const maintenanceRouter = Router();

maintenanceRouter.use(authMiddleware);
maintenanceRouter.use(requireRole("admin"));

// GET /api/admin/maintenance/status
maintenanceRouter.get("/status", (_req: Request, res: Response) => {
  const report = runDatabaseMaintenance(false);
  return res.json(report);
});

// POST /api/admin/maintenance/run
maintenanceRouter.post("/run", (req: Request, res: Response) => {
  const performVacuum = Boolean(req.body?.vacuum);
  const report = runDatabaseMaintenance(performVacuum);

  recordAuditLog({
    eventType: "DATABASE_MAINTENANCE",
    adminKey: req.body?.actor || "system",
    details: JSON.stringify({
      vacuum: performVacuum,
      status: report.status,
      sizeBytes: report.databaseSizeBytes,
      durationMs: report.durationMs,
    }),
  });

  return res.json({
    success: report.status === "ok",
    report,
  });
});
