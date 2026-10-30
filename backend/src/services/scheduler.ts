import { pruneOldBackups } from "./backup";
import { cursorStore } from "./cursorStore";
import { memoryMonitor } from "./memoryMonitor";
import { logger } from "./logger";

export interface ScheduledTask {
  name: string;
  intervalMs: number;
  lastRun?: string;
  runCount: number;
}

class Scheduler {
  private timers: NodeJS.Timeout[] = [];
  private tasks: Map<string, ScheduledTask> = new Map();
  private isRunning = false;

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    logger.info("[Scheduler] Starting background job scheduler...");

    // 1. Cursor flush (every 10s)
    this.registerTask("cursor_flush", 10000, () => {
      cursorStore.flush();
    });

    // 2. Memory stats check (every 60s)
    this.registerTask("memory_monitor", 60000, () => {
      memoryMonitor.getStats();
    });

    // 3. Backup retention pruning (every 24 hours)
    this.registerTask("backup_pruning", 86400000, () => {
      try {
        pruneOldBackups(7);
      } catch (err: any) {
        logger.warn(`[Scheduler] Backup pruning error: ${err.message}`);
      }
    });

    logger.info(`[Scheduler] Registered ${this.tasks.size} scheduled maintenance tasks.`);
  }

  public stop(): void {
    if (!this.isRunning) return;
    this.isRunning = false;
    for (const timer of this.timers) {
      clearInterval(timer);
    }
    this.timers = [];
    logger.info("[Scheduler] Background job scheduler stopped.");
  }

  public registerTask(name: string, intervalMs: number, fn: () => void): void {
    const task: ScheduledTask = {
      name,
      intervalMs,
      runCount: 0,
    };
    this.tasks.set(name, task);

    const timer = setInterval(() => {
      try {
        fn();
        task.runCount++;
        task.lastRun = new Date().toISOString();
      } catch (err: any) {
        logger.error(`[Scheduler] Task '${name}' failed: ${err.message}`, err);
      }
    }, intervalMs);
    timer.unref();

    this.timers.push(timer);
  }

  public getStatus() {
    return {
      isRunning: this.isRunning,
      activeTasks: Array.from(this.tasks.values()),
    };
  }
}

export const scheduler = new Scheduler();
