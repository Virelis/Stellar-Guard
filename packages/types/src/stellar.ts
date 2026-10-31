/**
 * Strongly-typed definitions for Stellar Horizon and Soroban RPC protocol objects
 */

import { StellarAddress } from "./index";

export type StellarNetworkId = "PUBLIC" | "TESTNET" | "FUTURENET" | "STANDALONE";

export interface StellarSignerKey {
  key: StellarAddress;
  weight: number;
  type: "ed25519_public_key" | "preauth_tx" | "hash_x";
}

export interface StellarAccountThresholds {
  lowThreshold: number;
  medThreshold: number;
  highThreshold: number;
}

export interface StellarAccountDetail {
  id: StellarAddress;
  sequence: string;
  subentryCount: number;
  thresholds: StellarAccountThresholds;
  signers: StellarSignerKey[];
  balances: {
    assetType: "native" | "credit_alphanum4" | "credit_alphanum12";
    assetCode?: string;
    assetIssuer?: StellarAddress;
    balance: string;
    limit?: string;
    isAuthorized: boolean;
    isAuthorizedToMaintainLiabilities?: boolean;
    isClawbackEnabled?: boolean;
  }[];
}

export interface HorizonOperationRecord {
  id: string;
  pagingToken: string;
  transactionSuccessful: boolean;
  sourceAccount: StellarAddress;
  type: string;
  typeI: number;
  createdAt: string;
  transactionHash: string;
  assetCode?: string;
  assetIssuer?: StellarAddress;
  amount?: string;
}

export interface SorobanRpcEventTopic {
  raw: string;
  decoded?: string;
}

export interface SorobanRpcEventResponse {
  type: "system" | "contract" | "diagnostic";
  ledger: number;
  ledgerClosedAt: string;
  contractId: string;
  id: string;
  pagingToken: string;
  topic: SorobanRpcEventTopic[];
  value: {
    xdr: string;
  };
  inSuccessfulContractCall: boolean;
}

