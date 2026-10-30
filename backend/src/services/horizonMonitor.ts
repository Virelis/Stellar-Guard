import { Horizon } from "@stellar/stellar-sdk";
import { logger } from "./logger";
import { metrics } from "./metrics";
import { eventBus } from "./eventBus";

const HORIZON_URL = process.env.HORIZON_URL ?? "https://horizon-testnet.stellar.org";
let server: Horizon.Server;

function getServer(): Horizon.Server {
  if (!server) {
    server = new Horizon.Server(HORIZON_URL);
  }
  return server;
}

export interface Transfer {
  id: string;
  from: string;
  to: string;
  amount: number;
  asset: string;
  ts: string;
}

// In-memory ring buffer (last 200 transfers)
const transfers: Transfer[] = [];
const MAX = 200;

let isRunning = false;
let streamCloseFn: (() => void) | null = null;
let lastCursor = "now";
let reconnectAttempts = 0;
let reconnectTimeout: NodeJS.Timeout | null = null;

function push(t: Transfer) {
  transfers.push(t);
  if (transfers.length > MAX) transfers.shift();
}

function connectStream() {
  if (!isRunning) return;

  try {
    const s = getServer();
    logger.info(`[HorizonMonitor] Connecting to Horizon stream at ${HORIZON_URL} (cursor: ${lastCursor})`);

    streamCloseFn = s
      .payments()
      .cursor(lastCursor)
      .stream({
        onmessage: (payment: any) => {
          reconnectAttempts = 0; // reset backoff upon receiving messages
          if (payment.id) {
            lastCursor = payment.id;
          }
          if (payment.type !== "payment") return;

          const transfer: Transfer = {
            id: payment.id,
            from: payment.from,
            to: payment.to,
            amount: parseFloat(payment.amount),
            asset: payment.asset_type === "native" ? "XLM" : payment.asset_code,
            ts: payment.created_at,
          };

          push(transfer);
          eventBus.broadcast("HEARTBEAT", {
            type: "HORIZON_PAYMENT",
            transferId: transfer.id,
            asset: transfer.asset,
            amount: transfer.amount,
          });
        },
        onerror: (err: any) => {
          metrics.recordHorizonError();
          logger.warn(`[HorizonMonitor] Stream disconnected or errored: ${err?.message ?? err}`);
          scheduleReconnect();
        },
      });
  } catch (err: any) {
    metrics.recordHorizonError();
    logger.error(`[HorizonMonitor] Failed to establish Horizon stream`, err);
    scheduleReconnect();
  }
}

function scheduleReconnect() {
  if (!isRunning) return;
  if (streamCloseFn) {
    try {
      streamCloseFn();
    } catch {}
    streamCloseFn = null;
  }

  reconnectAttempts++;
  // Exponential backoff: min 1s, max 30s + random jitter
  const backoff = Math.min(30000, 1000 * Math.pow(2, Math.min(reconnectAttempts, 5)));
  const jitter = Math.floor(Math.random() * 1000);
  const delay = backoff + jitter;

  logger.info(`[HorizonMonitor] Scheduling stream reconnect attempt #${reconnectAttempts} in ${delay}ms`);
  if (reconnectTimeout) clearTimeout(reconnectTimeout);
  reconnectTimeout = setTimeout(() => {
    connectStream();
  }, delay);
}

function start() {
  if (isRunning) return;
  isRunning = true;
  reconnectAttempts = 0;
  connectStream();
}

function stop() {
  isRunning = false;
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
  if (streamCloseFn) {
    try {
      streamCloseFn();
    } catch {}
    streamCloseFn = null;
  }
  logger.info("[HorizonMonitor] Stopped stream monitor");
}

function getStatus() {
  return {
    isRunning,
    horizonUrl: HORIZON_URL,
    lastCursor,
    reconnectAttempts,
    cachedTransfersCount: transfers.length,
  };
}

export const horizonMonitor = {
  start,
  stop,
  getStatus,
  getTransfers: () => [...transfers],
};
