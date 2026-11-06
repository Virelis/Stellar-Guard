import { getDb } from "./voteStore";

export class CursorStore {
  private memoryCache = new Map<string, string>();
  private dirty = new Set<string>();
  private flushTimer: NodeJS.Timeout | null = null;

  constructor() {
    // Periodic disk flush every 5 seconds
    this.flushTimer = setInterval(() => {
      this.flush();
    }, 5000);
    this.flushTimer.unref();
  }

  private ensureTable(): void {
    const db = getDb();
    db.exec(`
      CREATE TABLE IF NOT EXISTS stream_cursors (
        stream_name TEXT PRIMARY KEY,
        cursor      TEXT NOT NULL,
        updated_at  INTEGER NOT NULL DEFAULT (unixepoch())
      );
    `);
  }

  public getCursor(streamName: string): string | null {
    if (this.memoryCache.has(streamName)) {
      return this.memoryCache.get(streamName)!;
    }

    try {
      this.ensureTable();
      const db = getDb();
      const row = db
        .prepare(`SELECT cursor FROM stream_cursors WHERE stream_name = ?`)
        .get(streamName) as {
        cursor: string;
      };
      if (row?.cursor) {
        this.memoryCache.set(streamName, row.cursor);
        return row.cursor;
      }
    } catch {}

    return null;
  }

  public saveCursor(streamName: string, cursor: string): void {
    this.memoryCache.set(streamName, cursor);
    this.dirty.add(streamName);
  }

  public flush(): void {
    if (this.dirty.size === 0) return;

    try {
      this.ensureTable();
      const db = getDb();
      for (const name of this.dirty) {
        const cursor = this.memoryCache.get(name);
        if (cursor) {
          db.prepare(
            `INSERT INTO stream_cursors (stream_name, cursor, updated_at) 
             VALUES (?, ?, unixepoch())
             ON CONFLICT(stream_name) DO UPDATE SET cursor = excluded.cursor, updated_at = unixepoch()`
          ).run(name, cursor);
        }
      }
      this.dirty.clear();
    } catch {}
  }
}

export const cursorStore = new CursorStore();
