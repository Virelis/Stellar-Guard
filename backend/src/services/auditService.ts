import { getDb } from "./voteStore";

export interface AuditLogEntry {
  id?: number;
  eventType: string;
  assetCode?: string;
  issuer?: string;
  target?: string;
  adminKey?: string;
  details?: string;
  createdAt?: number;
}

export function recordAuditLog(entry: Omit<AuditLogEntry, "id" | "createdAt">): number {
  try {
    const db = getDb();
    if (!db || typeof db.prepare !== "function") return 0;
    const stmt = db.prepare(`
      INSERT INTO audit_logs (event_type, asset_code, issuer, target, admin_key, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      entry.eventType,
      entry.assetCode ?? null,
      entry.issuer ?? null,
      entry.target ?? null,
      entry.adminKey ?? null,
      entry.details ?? null
    );
    return Number(result.lastInsertRowid);
  } catch {
    return 0;
  }
}

export function queryAuditLogs(options: {
  target?: string;
  eventType?: string;
  limit?: number;
  offset?: number;
}): { total: number; logs: AuditLogEntry[] } {
  const db = getDb();
  const limit = Math.min(Math.max(options.limit ?? 50, 1), 200);
  const offset = Math.max(options.offset ?? 0, 0);

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (options.target) {
    conditions.push("target = ?");
    params.push(options.target);
  }

  if (options.eventType) {
    conditions.push("event_type = ?");
    params.push(options.eventType);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const countRow = db.prepare(`SELECT COUNT(*) as total FROM audit_logs ${whereClause}`).get(...params) as {
    total: number;
  };
  const total = countRow?.total ?? 0;

  const rows = db
    .prepare(
      `SELECT id, event_type, asset_code, issuer, target, admin_key, details, created_at 
       FROM audit_logs ${whereClause} 
       ORDER BY created_at DESC, id DESC 
       LIMIT ? OFFSET ?`
    )
    .all(...params, limit, offset) as any[];

  const logs: AuditLogEntry[] = rows.map((r) => ({
    id: r.id,
    eventType: r.event_type,
    assetCode: r.asset_code ?? undefined,
    issuer: r.issuer ?? undefined,
    target: r.target ?? undefined,
    adminKey: r.admin_key ?? undefined,
    details: r.details ?? undefined,
    createdAt: r.created_at,
  }));

  return { total, logs };
}
