/**
 * Standardized error definitions and error mappings for Stellar-Guard
 */

export enum SorobanContractErrorCode {
  NotInitialized = 1,
  AlreadyInitialized = 2,
  Unauthorized = 3,
  InvalidThreshold = 4,
  ProposalNotFound = 5,
  ProposalAlreadyExecuted = 6,
  ProposalExpired = 7,
  AlreadyVoted = 8,
  QuorumNotReached = 9,
  EmergencyPaused = 10,
  AdminAlreadyExists = 11,
  AdminNotFound = 12,
  CannotRemoveLastAdmin = 13,
  AssetNotFrozen = 14,
  AssetAlreadyFrozen = 15,
  InvalidSequence = 16,
  TargetWhitelisted = 17,
  CooldownActive = 18,
  TimelockActive = 19,
  BatchTooLarge = 20,
}

export type StandardErrorCode =
  | "AUTH_UNAUTHORIZED"
  | "AUTH_FORBIDDEN"
  | "VALIDATION_FAILED"
  | "PROPOSAL_NOT_FOUND"
  | "PROPOSAL_EXPIRED"
  | "QUORUM_INSUFFICIENT"
  | "CIRCUIT_BREAKER_ACTIVE"
  | "HORIZON_UNAVAILABLE"
  | "SOROBAN_RPC_ERROR"
  | "DATABASE_ERROR"
  | "RATE_LIMIT_EXCEEDED"
  | "INTERNAL_SERVER_ERROR";

export interface ProtocolErrorResponse {
  error: {
    code: StandardErrorCode | string;
    message: string;
    details?: unknown;
    sorobanCode?: number;
    correlationId?: string;
    timestamp: string;
  };
}

export function mapSorobanErrorToHttp(sorobanCode: number): {
  status: number;
  message: string;
} {
  switch (sorobanCode) {
    case SorobanContractErrorCode.Unauthorized:
      return { status: 403, message: "Caller is not an authorized governance administrator." };
    case SorobanContractErrorCode.ProposalNotFound:
      return { status: 404, message: "The requested governance proposal does not exist." };
    case SorobanContractErrorCode.AlreadyVoted:
      return { status: 409, message: "Administrator has already cast a vote on this proposal." };
    case SorobanContractErrorCode.QuorumNotReached:
      return { status: 400, message: "Required multi-admin signature quorum has not been satisfied." };
    case SorobanContractErrorCode.EmergencyPaused:
      return { status: 503, message: "Protocol operations are temporarily suspended by circuit breaker." };
    case SorobanContractErrorCode.TargetWhitelisted:
      return { status: 422, message: "Target account is registered on the compliance safe whitelist." };
    case SorobanContractErrorCode.CooldownActive:
      return { status: 429, message: "Cooldown period is active; please wait before resubmitting." };
    case SorobanContractErrorCode.TimelockActive:
      return { status: 425, message: "Execution timelock has not expired yet." };
    case SorobanContractErrorCode.ProposalExpired:
      return { status: 410, message: "Proposal lifetime has expired." };
    default:
      return { status: 400, message: `Soroban contract execution error (${sorobanCode}).` };
  }
}
