import crypto from "crypto";
import { getDb } from "./voteStore";

export interface WebhookSubscription {
  id: number;
  url: string;
  eventFilter: string;
  secret: string;
  isActive: boolean;
  createdAt: number;
}

export function signWebhookPayload(payload: string, secret: string): string {
  const hmac = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return `sha256=${hmac}`;
}

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  if (!signature || !signature.startsWith("sha256=")) return false;
  const expected = signWebhookPayload(payload, secret);
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function registerWebhook(
  url: string,
  eventFilter = "*",
  secret?: string
): WebhookSubscription {
  const db = getDb();
  const autoSecret =
    secret && secret.length >= 16 ? secret : crypto.randomBytes(24).toString("hex");

  const stmt = db.prepare(`
    INSERT INTO webhooks (url, event_filter, secret, is_active)
    VALUES (?, ?, ?, 1)
  `);
  const result = stmt.run(url, eventFilter, autoSecret);
  const id = Number(result.lastInsertRowid);

  const row = db.prepare(`SELECT * FROM webhooks WHERE id = ?`).get(id) as any;
  return {
    id: row.id,
    url: row.url,
    eventFilter: row.event_filter,
    secret: row.secret,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
  };
}

export function listWebhooks(): WebhookSubscription[] {
  const db = getDb();
  const rows = db
    .prepare(`SELECT * FROM webhooks WHERE is_active = 1 ORDER BY created_at DESC`)
    .all() as any[];
  return rows.map((r) => ({
    id: r.id,
    url: r.url,
    eventFilter: r.event_filter,
    secret: r.secret,
    isActive: Boolean(r.is_active),
    createdAt: r.created_at,
  }));
}

export function deleteWebhook(id: number): boolean {
  const db = getDb();
  const result = db.prepare(`DELETE FROM webhooks WHERE id = ?`).run(id);
  return Number(result.changes) > 0;
}

export function rotateWebhookSecret(
  id: number,
  customSecret?: string
): { id: number; oldSecret: string; newSecret: string } | null {
  const db = getDb();
  const existing = db.prepare(`SELECT secret FROM webhooks WHERE id = ?`).get(id) as
    { secret: string } | undefined;
  if (!existing) return null;

  const oldSecret = existing.secret;
  const newSecret =
    customSecret && customSecret.length >= 16
      ? customSecret
      : crypto.randomBytes(24).toString("hex");

  db.prepare(`UPDATE webhooks SET secret = ? WHERE id = ?`).run(newSecret, id);
  return { id, oldSecret, newSecret };
}
