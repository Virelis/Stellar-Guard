/**
 * @stellar-guard/types
 * Shared type definitions for Stellar-Guard smart contracts, backend services, and frontend UI.
 */

export type StellarAddress = string; // 56-char 'G...' public key
export type SorobanContractId = string; // 56-char 'C...' contract hash

export type NetworkName = "testnet" | "futurenet" | "mainnet" | "standalone";

export interface NetworkConfig {
  name: NetworkName;
  passphrase: string;
  horizonUrl: string;
  rpcUrl: string;
  contractId?: SorobanContractId;
}

export type IncidentCategory =
  | "OFAC_SANCTIONS"
  | "EXPLOIT_DRAIN"
  | "COMPROMISED_KEY"
  | "COURT_ORDER"
  | "AML_HIGH_RISK";

export interface ProposalVote {
  adminKey: StellarAddress;
  votedAt: number; // Unix timestamp
  signature?: string;
}

export interface GovernanceProposal {
  id?: string;
  assetCode: string;
  issuer: StellarAddress;
  target: StellarAddress;
  proposer: StellarAddress;
  category: IncidentCategory;
  referenceTicket?: string;
  currentVotes: number;
  requiredQuorum: number;
  voters: StellarAddress[];
  isExecuted: boolean;
  createdAt: number;
  expiresAt: number;
}

export interface QuarantinedAsset {
  target: StellarAddress;
  assetCode: string;
  issuer: StellarAddress;
  frozenAtLedger: number;
  frozenAtTimestamp: number;
  quorumSigners: StellarAddress[];
  actionSeq: number;
}

export interface AuditRecord {
  id: number;
  eventType: string;
  assetCode?: string;
  issuer?: StellarAddress;
  target?: StellarAddress;
  adminKey?: StellarAddress;
  details?: string;
  createdAt: number;
}

export interface RiskFactor {
  code: string;
  description: string;
  weight: number;
}

export interface RiskAssessmentResult {
  targetAddress: StellarAddress;
  riskScore: number; // 0 - 100
  riskLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  factors: RiskFactor[];
  evaluatedAt: string;
}

export interface PreflightSimulationResult {
  valid: boolean;
  assetCode: string;
  issuer: StellarAddress;
  target: StellarAddress;
  isAlreadyFrozen: boolean;
  currentVotes: number;
  postVoteCount: number;
  quorumThreshold: number;
  willExecuteAtQuorum: boolean;
  estimatedFeeStroops: string;
  estimatedFeeXlm: string;
  error?: string;
}

export interface WebhookRegistration {
  id: number;
  url: string;
  eventType: string;
  secret: string;
  active: boolean;
  createdAt: number;
}

export * from "./errors";
export * from "./stellar";


