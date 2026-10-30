import { logger } from "./logger";

export interface MemoryStats {
  rssMb: number;
  heapTotalMb: number;
  heapUsedMb: number;
  heapUtilizationPercent: number;
  externalMb: number;
  timestamp: string;
}

class MemoryMonitor {
  private timer: NodeJS.Timeout | null = null;
  private readonly warningThresholdMb: number;

  constructor(warningThresholdMb = 512) {
    this.warningThresholdMb = warningThresholdMb;
  }

  public start(intervalMs = 60000): void {
    if (this.timer) return;
    this.timer = setInterval(() => {
      this.checkMemory();
    }, intervalMs).unref();
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  public getStats(): MemoryStats {
    const mem = process.memoryUsage();
    const rssMb = parseFloat((mem.rss / (1024 * 1024)).toFixed(2));
    const heapTotalMb = parseFloat((mem.heapTotal / (1024 * 1024)).toFixed(2));
    const heapUsedMb = parseFloat((mem.heapUsed / (1024 * 1024)).toFixed(2));
    const externalMb = parseFloat((mem.external / (1024 * 1024)).toFixed(2));
    const heapUtilizationPercent = parseFloat(((heapUsedMb / (heapTotalMb || 1)) * 100).toFixed(2));

    return {
      rssMb,
      heapTotalMb,
      heapUsedMb,
      heapUtilizationPercent,
      externalMb,
      timestamp: new Date().toISOString(),
    };
  }

  private checkMemory(): void {
    const stats = this.getStats();
    if (stats.heapUsedMb > this.warningThresholdMb) {
      logger.warn(
        `[MemoryMonitor] High memory usage detected: ${stats.heapUsedMb}MB / ${stats.heapTotalMb}MB (${stats.heapUtilizationPercent}%)`
      );
    }
  }
}

export const memoryMonitor = new MemoryMonitor();
