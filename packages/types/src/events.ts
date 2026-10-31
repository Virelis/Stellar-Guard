/**
 * Governance Real-Time Event Bus and SSE Event Specifications
 */

export type GovernanceEventType =
  | "proposal.created"
  | "proposal.voted"
  | "proposal.executed"
  | "proposal.rejected"
  | "asset.frozen"
  | "asset.unfrozen"
  | "admin.added"
  | "admin.removed"
  | "circuit.tripped";

export interface GovernanceSSEEvent<T = unknown> {
  id: string;
  type: GovernanceEventType;
  data: T;
  timestamp: number;
  correlationId?: string;
}

export interface StreamHeartbeatEvent {
  type: "heartbeat";
  timestamp: number;
  activeSubscribers: number;
  latestLedgerSequence?: number;
}

