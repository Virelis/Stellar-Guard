import { Router, Request, Response } from "express";
import { getDb } from "../services/voteStore";
import { getMigrationVersion } from "../services/migrator";
import { metrics } from "../services/metrics";

export const healthRouter = Router();

healthRouter.get("/live", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

healthRouter.get("/health", async (_req: Request, res: Response) => {
  const dbHealth = checkDatabaseHealth();
  const healthy = dbHealth.status === "ok";

  const payload = {
    status: healthy ? "ok" : "degraded",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    checks: {
      database: dbHealth,
      memory: {
        rssBytes: process.memoryUsage().rss,
        heapUsedBytes: process.memoryUsage().heapUsed,
      },
    },
  };

  res.status(healthy ? 200 : 503).json(payload);
});

healthRouter.get("/ready", (_req: Request, res: Response) => {
  const dbHealth = checkDatabaseHealth();
  if (dbHealth.status === "ok") {
    res.status(200).json({ status: "ready", database: dbHealth });
  } else {
    res.status(503).json({ status: "not_ready", database: dbHealth });
  }
});

healthRouter.get("/metrics", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/plain; version=0.0.4");
  res.send(metrics.getMetricsAsText());
});

function checkDatabaseHealth(): { status: "ok" | "error"; migrationVersion?: number; error?: string } {
  try {
    const db = getDb();
    const row = db.prepare("SELECT 1 as alive").get() as { alive: number };
    if (row?.alive === 1) {
      const v = getMigrationVersion(db);
      return { status: "ok", migrationVersion: v };
    }
    return { status: "error", error: "Database returned invalid ping result" };
  } catch (err: any) {
    return { status: "error", error: err.message || String(err) };
  }
}
