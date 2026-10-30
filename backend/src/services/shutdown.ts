import http from "http";
import { logger } from "./logger";
import { horizonMonitor } from "./horizonMonitor";
import { getDb } from "./voteStore";
import { scheduler } from "./scheduler";

export function registerGracefulShutdown(server: http.Server): void {
  let isShuttingDown = false;

  const handleShutdown = (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    logger.info(`[Shutdown] Received ${signal}. Commencing graceful shutdown...`);

    // 1. Stop background Horizon polling and streaming
    try {
      horizonMonitor.stop();
      scheduler.stop();
      logger.info("[Shutdown] Horizon monitor stopped.");
    } catch (err: any) {
      logger.error("[Shutdown] Error stopping Horizon monitor", err);
    }

    // 2. Stop accepting new HTTP requests and wait for in-flight requests
    const timeout = setTimeout(() => {
      logger.warn("[Shutdown] Forcefully terminating active connections after timeout.");
      process.exit(1);
    }, 10000).unref();

    server.close((err) => {
      clearTimeout(timeout);
      if (err) {
        logger.error("[Shutdown] Error closing HTTP server", err);
        process.exit(1);
      }

      logger.info("[Shutdown] HTTP server closed successfully.");

      // 3. Close SQLite database connection cleanly
      try {
        const db = getDb();
        if (db && typeof db.close === "function") {
          db.close();
          logger.info("[Shutdown] SQLite database connection closed.");
        }
      } catch (dbErr: any) {
        logger.error("[Shutdown] Error closing SQLite database", dbErr);
      }

      logger.info("[Shutdown] Graceful shutdown completed cleanly. Exiting.");
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => handleShutdown("SIGTERM"));
  process.on("SIGINT", () => handleShutdown("SIGINT"));
}
