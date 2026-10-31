/**
 * Resilient Circuit Breaker State Machine
 * Protects backend services against cascading failures during Soroban RPC or Horizon outages.
 */

export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

export interface CircuitBreakerOptions {
  failureThreshold?: number;
  resetTimeoutMs?: number;
  callTimeoutMs?: number;
}

export class CircuitBreaker {
  private state: CircuitState = "CLOSED";
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private readonly failureThreshold: number;
  private readonly resetTimeoutMs: number;
  private readonly callTimeoutMs: number;

  constructor(options: CircuitBreakerOptions = {}) {
    this.failureThreshold = options.failureThreshold ?? 5;
    this.resetTimeoutMs = options.resetTimeoutMs ?? 10000;
    this.callTimeoutMs = options.callTimeoutMs ?? 5000;
  }

  public getState(): CircuitState {
    if (this.state === "OPEN") {
      const now = Date.now();
      if (now - this.lastFailureTime >= this.resetTimeoutMs) {
        this.state = "HALF_OPEN";
      }
    }
    return this.state;
  }

  public async execute<T>(action: () => Promise<T>): Promise<T> {
    const currentState = this.getState();

    if (currentState === "OPEN") {
      throw new Error("CircuitBreaker is OPEN: downstream service calls temporarily rejected.");
    }

    try {
      // Execute action with timeout race
      const result = await Promise.race([
        action(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("CircuitBreaker call timed out.")), this.callTimeoutMs)
        ),
      ]);

      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure();
      throw err;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.state = "CLOSED";
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === "HALF_OPEN" || this.failureCount >= this.failureThreshold) {
      this.state = "OPEN";
    }
  }

  public reset(): void {
    this.failureCount = 0;
    this.state = "CLOSED";
  }
}

