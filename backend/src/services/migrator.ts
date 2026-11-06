import { DatabaseSync } from "node:sqlite";

export interface Migration {
  version: number;
  name: string;
  up: (db: DatabaseSync) => void;
}

export const migrations: Migration[] = [
  {
    version: 1,
    name: "create_votes_table",
    up: (db: DatabaseSync) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS votes (
          vote_key   TEXT NOT NULL,
          asset_code TEXT NOT NULL,
          issuer     TEXT NOT NULL,
          target     TEXT NOT NULL,
          admin_key  TEXT NOT NULL,
          created_at INTEGER NOT NULL DEFAULT (unixepoch()),
          PRIMARY KEY (vote_key, admin_key)
        );
      `);
    },
  },
  {
    version: 2,
    name: "create_audit_logs_table",
    up: (db: DatabaseSync) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id         INTEGER PRIMARY KEY AUTOINCREMENT,
          event_type TEXT NOT NULL,
          asset_code TEXT,
          issuer     TEXT,
          target     TEXT,
          admin_key  TEXT,
          details    TEXT,
          created_at INTEGER NOT NULL DEFAULT (unixepoch())
        );
        CREATE INDEX IF NOT EXISTS idx_audit_target ON audit_logs(target);
        CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
      `);
    },
  },
  {
    version: 3,
    name: "create_webhooks_table",
    up: (db: DatabaseSync) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS webhooks (
          id           INTEGER PRIMARY KEY AUTOINCREMENT,
          url          TEXT NOT NULL,
          event_filter TEXT NOT NULL DEFAULT '*',
          secret       TEXT,
          is_active    INTEGER NOT NULL DEFAULT 1,
          created_at   INTEGER NOT NULL DEFAULT (unixepoch())
        );
      `);
    },
  },
];

export function runMigrations(db: DatabaseSync): number {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      version    INTEGER NOT NULL UNIQUE,
      name       TEXT NOT NULL,
      applied_at INTEGER NOT NULL DEFAULT (unixepoch())
    );
  `);

  const appliedRows = db.prepare(`SELECT version FROM schema_migrations`).all() as {
    version: number;
  }[];
  const appliedSet = new Set(appliedRows.map((r) => r.version));

  let appliedCount = 0;
  for (const migration of migrations) {
    if (!appliedSet.has(migration.version)) {
      migration.up(db);
      db.prepare(`INSERT INTO schema_migrations (version, name) VALUES (?, ?)`).run(
        migration.version,
        migration.name
      );
      appliedCount++;
    }
  }

  return appliedCount;
}

export function getMigrationVersion(db: DatabaseSync): number {
  const row = db.prepare(`SELECT MAX(version) as max_v FROM schema_migrations`).get() as {
    max_v: number | null;
  };
  return row?.max_v ?? 0;
}
