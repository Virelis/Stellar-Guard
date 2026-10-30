import { Request, Response, NextFunction } from "express";

export class MetricsRegistry {
  private httpRequestsTotal: Map<string, number> = new Map();
  private httpRequestDurationMs: Map<string, number[]> = new Map();
  private votesCastTotal: Map<string, number> = new Map();
  private freezesExecutedTotal: Map<string, number> = new Map();
  private horizonStreamErrors: number = 0;
  private startTime: number = Date.now();

  public recordHttpRequest(method: string, path: string, status: number, durationMs: number): void {
    const key = `method="${method}",path="${path}",status="${status}"`;
    this.httpRequestsTotal.set(key, (this.httpRequestsTotal.get(key) ?? 0) + 1);

    const pathKey = `method="${method}",path="${path}"`;
    const durations = this.httpRequestDurationMs.get(pathKey) ?? [];
    if (durations.length >= 1000) {
      durations.shift(); // keep sliding buffer of 1000 samples
    }
    durations.push(durationMs);
    this.httpRequestDurationMs.set(pathKey, durations);
  }

  public recordVote(assetCode: string): void {
    this.votesCastTotal.set(assetCode, (this.votesCastTotal.get(assetCode) ?? 0) + 1);
  }

  public recordFreeze(assetCode: string): void {
    this.freezesExecutedTotal.set(assetCode, (this.freezesExecutedTotal.get(assetCode) ?? 0) + 1);
  }

  public recordHorizonError(): void {
    this.horizonStreamErrors += 1;
  }

  public getMetricsAsText(): string {
    const lines: string[] = [];

    // Header & Uptime
    lines.push("# HELP process_uptime_seconds Total seconds the backend process has been alive");
    lines.push("# TYPE process_uptime_seconds gauge");
    lines.push(`process_uptime_seconds ${(Date.now() - this.startTime) / 1000}`);

    // HTTP Requests Total
    lines.push("# HELP http_requests_total Total number of HTTP requests serviced");
    lines.push("# TYPE http_requests_total counter");
    for (const [labels, count] of this.httpRequestsTotal.entries()) {
      lines.push(`http_requests_total{${labels}} ${count}`);
    }

    // HTTP Request Duration Summary
    lines.push("# HELP http_request_duration_ms_avg Average HTTP response duration in milliseconds");
    lines.push("# TYPE http_request_duration_ms_avg gauge");
    for (const [labels, samples] of this.httpRequestDurationMs.entries()) {
      const avg = samples.reduce((a, b) => a + b, 0) / (samples.length || 1);
      lines.push(`http_request_duration_ms_avg{${labels}} ${avg.toFixed(2)}`);
    }

    // Stellar Votes Cast
    lines.push("# HELP stellar_votes_cast_total Total multi-sig governance votes cast");
    lines.push("# TYPE stellar_votes_cast_total counter");
    for (const [asset, count] of this.votesCastTotal.entries()) {
      lines.push(`stellar_votes_cast_total{asset="${asset}"} ${count}`);
    }

    // Stellar Freezes Executed
    lines.push("# HELP stellar_freezes_executed_total Total asset quarantine freezes executed");
    lines.push("# TYPE stellar_freezes_executed_total counter");
    for (const [asset, count] of this.freezesExecutedTotal.entries()) {
      lines.push(`stellar_freezes_executed_total{asset="${asset}"} ${count}`);
    }

    // Horizon Stream Errors
    lines.push("# HELP stellar_horizon_stream_errors_total Total errors encountered streaming Horizon events");
    lines.push("# TYPE stellar_horizon_stream_errors_total counter");
    lines.push(`stellar_horizon_stream_errors_total ${this.horizonStreamErrors}`);

    return lines.join("\n") + "\n";
  }
}

export const metrics = new MetricsRegistry();

export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    const cleanPath = req.baseUrl || req.path || "/";
    metrics.recordHttpRequest(req.method, cleanPath, res.statusCode, duration);
  });
  next();
}
