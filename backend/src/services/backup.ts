import fs from "fs";
import path from "path";
import { getDb } from "./voteStore";
import { logger } from "./logger";

export interface BackupInfo {
  filename: string;
  filepath: string;
  sizeBytes: number;
  createdAt: string;
}

const DEFAULT_BACKUP_DIR = process.env.BACKUP_DIR ?? path.join(__dirname, "../../backups");

export async function createDatabaseBackup(customDir?: string): Promise<BackupInfo> {
  const dir = customDir ?? DEFAULT_BACKUP_DIR;
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `stellar-guard-backup-${timestamp}.db`;
  const filepath = path.join(dir, filename);

  const db = getDb();
  // SQLite VACUUM INTO performs an atomic live database backup without downtime
  const sanitizedPath = filepath.replace(/'/g, "''");
  db.exec(`VACUUM INTO '${sanitizedPath}';`);

  const stats = fs.statSync(filepath);
  logger.info(`[Backup] Created SQLite snapshot at ${filepath} (${stats.size} bytes)`);

  return {
    filename,
    filepath,
    sizeBytes: stats.size,
    createdAt: new Date().toISOString(),
  };
}

export function listDatabaseBackups(customDir?: string): BackupInfo[] {
  const dir = customDir ?? DEFAULT_BACKUP_DIR;
  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".db"));
  return files.map((filename) => {
    const filepath = path.join(dir, filename);
    const stats = fs.statSync(filepath);
    return {
      filename,
      filepath,
      sizeBytes: stats.size,
      createdAt: stats.birthtime.toISOString(),
    };
  });
}

export function pruneOldBackups(retentionDays = 7, customDir?: string): number {
  const dir = customDir ?? DEFAULT_BACKUP_DIR;
  if (!fs.existsSync(dir)) return 0;

  const cutoff = Date.now() - retentionDays * 86400 * 1000;
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".db"));
  let removed = 0;

  for (const f of files) {
    const fullPath = path.join(dir, f);
    const stats = fs.statSync(fullPath);
    if (stats.mtimeMs < cutoff) {
      fs.unlinkSync(fullPath);
      removed++;
      logger.info(`[Backup] Pruned expired backup: ${f}`);
    }
  }

  return removed;
}
