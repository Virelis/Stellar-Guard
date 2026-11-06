/**
 * OpenTelemetry and Distributed Trace Span Instrumentation Helper
 * Instruments asynchronous jobs and RPC calls with correlation contexts.
 */

import crypto from "crypto";

export interface SpanContext {
  traceId: string;
  spanId: string;
  name: string;
  startTime: number;
  attributes: Record<string, string | number | boolean>;
}

export async function traceSpan<T>(
  name: string,
  action: (span: SpanContext) => Promise<T>,
  parentTraceId?: string
): Promise<T> {
  const span: SpanContext = {
    traceId: parentTraceId || crypto.randomBytes(16).toString("hex"),
    spanId: crypto.randomBytes(8).toString("hex"),
    name,
    startTime: performance.now(),
    attributes: {},
  };

  try {
    const result = await action(span);
    const durationMs = Math.round(performance.now() - span.startTime);
    span.attributes["duration_ms"] = durationMs;
    span.attributes["status"] = "OK";
    return result;
  } catch (err: any) {
    const durationMs = Math.round(performance.now() - span.startTime);
    span.attributes["duration_ms"] = durationMs;
    span.attributes["status"] = "ERROR";
    span.attributes["error_message"] = err?.message || String(err);
    throw err;
  }
}
