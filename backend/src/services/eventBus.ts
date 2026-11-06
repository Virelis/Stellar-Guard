import { EventEmitter } from "events";
import { Response } from "express";

export interface GovernanceEvent {
  type:
    | "PROPOSAL_CREATED"
    | "VOTE_CAST"
    | "FREEZE_EXECUTED"
    | "UNFREEZE_EXECUTED"
    | "PROPOSAL_CANCELLED"
    | "HEARTBEAT";
  timestamp: string;
  data: Record<string, unknown>;
}

class EventBus extends EventEmitter {
  private clients: Set<Response> = new Set();

  constructor() {
    super();
    // Send periodic SSE keep-alive heartbeat ping
    setInterval(() => {
      this.sendHeartbeat();
    }, 15000).unref();
  }

  public registerClient(res: Response): void {
    this.clients.add(res);

    // Initial connection acknowledgement
    const initialEvent: GovernanceEvent = {
      type: "HEARTBEAT",
      timestamp: new Date().toISOString(),
      data: {
        message: "Connected to Stellar-Guard SSE event stream",
        activeClients: this.clients.size,
      },
    };
    res.write(`data: ${JSON.stringify(initialEvent)}\n\n`);
  }

  public removeClient(res: Response): void {
    this.clients.delete(res);
  }

  public getClientCount(): number {
    return this.clients.size;
  }

  public broadcast(type: GovernanceEvent["type"], data: Record<string, unknown>): void {
    const event: GovernanceEvent = {
      type,
      timestamp: new Date().toISOString(),
      data,
    };
    const message = `data: ${JSON.stringify(event)}\n\n`;

    for (const client of this.clients) {
      try {
        client.write(message);
      } catch {
        this.clients.delete(client);
      }
    }
  }

  private sendHeartbeat(): void {
    if (this.clients.size === 0) return;
    const ping = `event: ping\ndata: ${Date.now()}\n\n`;
    for (const client of this.clients) {
      try {
        client.write(ping);
      } catch {
        this.clients.delete(client);
      }
    }
  }
}

export const eventBus = new EventBus();
