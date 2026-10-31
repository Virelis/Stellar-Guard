/**
 * Comprehensive Multi-Sig Governance and Quorum Models
 */

import { StellarAddress } from "./index";

export type ProposalStatus =
  | "PENDING_QUORUM"
  | "QUORUM_MET"
  | "TIMELOCKED"
  | "EXECUTED"
  | "EXPIRED"
  | "REJECTED";

export interface QuorumCalculation {
  totalAdmins: number;
  thresholdPercentage: number;
  requiredVotes: number;
  currentVotes: number;
  isSatisfied: boolean;
  remainingVotesNeeded: number;
}

export function calculateRequiredQuorum(totalAdmins: number, thresholdPercent: number = 66): number {
  if (totalAdmins <= 0) return 1;
  const calculated = Math.ceil((totalAdmins * thresholdPercent) / 100);
  return Math.max(1, Math.min(calculated, totalAdmins));
}

export interface GovernanceTransitionEvent {
  proposalId: string;
  fromStatus: ProposalStatus;
  toStatus: ProposalStatus;
  triggeredBy: StellarAddress;
  timestamp: number;
  reason?: string;
}
