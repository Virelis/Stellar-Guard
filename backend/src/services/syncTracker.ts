import axios from "axios";
import { logger } from "./logger";

export interface SyncStatus {
  lastProcessedLedger: number;
  networkLatestLedger: number;
  lagLedgers: number;
  isSynced: boolean;
  lastSyncCheck: string;
}

class SyncTracker {
  private lastProcessedLedger = 0;
  private networkLatestLedger = 0;
  private lastSyncCheck = new Date().toISOString();

  public updateProcessedLedger(sequence: number): void {
    if (sequence > this.lastProcessedLedger) {
      this.lastProcessedLedger = sequence;
    }
  }

  public async checkSync(horizonUrl: string): Promise<SyncStatus> {
    try {
      const { data } = await axios.get(horizonUrl, { timeout: 4000 });
      const networkLedger = data.core_latest_ledger ?? data.history_latest_ledger ?? 0;
      if (networkLedger > 0) {
        this.networkLatestLedger = networkLedger;
        if (this.lastProcessedLedger === 0) {
          // If first run, initialize processed to current network ledger
          this.lastProcessedLedger = networkLedger;
        }
      }
    } catch (err: any) {
      logger.debug(`[SyncTracker] Failed to probe network ledger: ${err.message}`);
    }

    this.lastSyncCheck = new Date().toISOString();
    return this.getStatus();
  }

  public getStatus(): SyncStatus {
    const lag = Math.max(0, this.networkLatestLedger - this.lastProcessedLedger);
    return {
      lastProcessedLedger: this.lastProcessedLedger,
      networkLatestLedger: this.networkLatestLedger,
      lagLedgers: lag,
      isSynced: lag <= 5, // considers synced if lag is within 5 ledgers (~25s)
      lastSyncCheck: this.lastSyncCheck,
    };
  }
}

export const syncTracker = new SyncTracker();
