import { getDb } from "./voteStore";
import { logger } from "./logger";

export interface DatabaseMaintenanceReport {
  status: "ok" | "degraded" | "error";
  integrity: string[];
  foreignKeyViolations: any[];
  databaseSizeBytes: number;
  vacuumed: boolean;
  optimized: boolean;
  durationMs: number;
  timestamp: string;
}

export function runDatabaseMaintenance(performVacuum: boolean = false): DatabaseMaintenanceReport {
  const startTime = Date.now();
  const db = getDb();

  try {
    // 1. Check integrity
    const integrityRows = db.prepare("PRAGMA integrity_check").all() as Array<{
      integrity_check: string;
    }>;
    const integrity = integrityRows.map((r) => r.integrity_check);
    const isIntegrityOk = integrity.length === 1 && integrity[0] === "ok";

    // 2. Check foreign keys
    const fkRows = db.prepare("PRAGMA foreign_key_check").all();

    // 3. Page calculations
    const pageCountRow = db.prepare("PRAGMA page_count").get() as
      { page_count: number } | undefined;
    const pageSizeRow = db.prepare("PRAGMA page_size").get() as { page_size: number } | undefined;
    const pageCount = pageCountRow?.page_count ?? 0;
    const pageSize = pageSizeRow?.page_size ?? 4096;
    const databaseSizeBytes = pageCount * pageSize;

    // 4. Optional vacuum
    let vacuumed = false;
    if (performVacuum) {
      db.exec("VACUUM");
      vacuumed = true;
    }

    // 5. Query planner optimization
    db.exec("PRAGMA optimize");

    const durationMs = Date.now() - startTime;
    const status = isIntegrityOk && fkRows.length === 0 ? "ok" : "degraded";

    logger.info("Database maintenance completed", {
      status,
      sizeBytes: databaseSizeBytes,
      vacuumed,
      durationMs,
    });

    return {
      status,
      integrity,
      foreignKeyViolations: fkRows,
      databaseSizeBytes,
      vacuumed,
      optimized: true,
      durationMs,
      timestamp: new Date().toISOString(),
    };
  } catch (err: any) {
    logger.error("Database maintenance error", { error: err?.message });
    return {
      status: "error",
      integrity: [err?.message || "Unknown error"],
      foreignKeyViolations: [],
      databaseSizeBytes: 0,
      vacuumed: false,
      optimized: false,
      durationMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    };
  }
}
