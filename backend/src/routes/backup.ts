import { Router, Request, Response } from "express";
import { createDatabaseBackup, listDatabaseBackups, pruneOldBackups } from "../services/backup";

export const backupRouter = Router();

backupRouter.get("/", (_req: Request, res: Response) => {
  const backups = listDatabaseBackups();
  res.status(200).json({
    success: true,
    count: backups.length,
    backups,
  });
});

backupRouter.post("/", async (_req: Request, res: Response) => {
  try {
    const backup = await createDatabaseBackup();
    res.status(201).json({
      success: true,
      message: "Database backup created successfully",
      backup,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to generate database backup",
      details: err.message || String(err),
    });
  }
});

backupRouter.post("/prune", (req: Request, res: Response) => {
  const retentionDays = req.body?.retentionDays ? parseInt(req.body.retentionDays, 10) : 7;
  const removed = pruneOldBackups(retentionDays);
  res.status(200).json({
    success: true,
    message: `Pruned ${removed} backup file(s) older than ${retentionDays} days`,
    removedCount: removed,
  });
});
