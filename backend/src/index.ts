import "dotenv/config";
import express from "express";
import cors from "cors";
import { transfersRouter } from "./routes/transfers";
import { freezeRouter } from "./routes/freeze";
import { healthRouter } from "./routes/health";
import { eventsRouter } from "./routes/events";
import { xdrRouter } from "./routes/xdr";
import { auditRouter } from "./routes/audit";
import { metricsMiddleware } from "./services/metrics";
import { errorHandler } from "./middleware/errorHandler";
import { generalRateLimiter } from "./middleware/rateLimiter";
import { horizonMonitor } from "./services/horizonMonitor";

const app = express();

// Restrict CORS to the configured frontend origin.
// Set ALLOWED_ORIGIN=* only for local development.
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN ?? "http://localhost:3000";
app.use(cors({ origin: ALLOWED_ORIGIN, methods: ["GET", "POST", "OPTIONS"] }));

app.use(express.json({ limit: "64kb" }));
app.use(metricsMiddleware);
app.use(generalRateLimiter);

app.use(healthRouter);
app.use("/api/transfers", transfersRouter);
app.use("/api/freeze", freezeRouter);
app.use("/api/events", eventsRouter);
app.use("/api/xdr", xdrRouter);
app.use("/api/audit", auditRouter);

app.use(errorHandler);

if (require.main === module) {
  const PORT = process.env.PORT ?? 4000;
  app.listen(PORT, () => {
    console.log(`Stellar-Guard backend on :${PORT} (CORS: ${ALLOWED_ORIGIN})`);
    horizonMonitor.start();
  });
}

export default app;
