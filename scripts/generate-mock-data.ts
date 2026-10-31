/**
 * Stellar-Guard Synthetic Mock Data Generator
 * Generates realistic compliance proposals, audit events, and AML risk assessments
 * for testing, benchmarking, and offline demo environments.
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";

export interface MockAuditRecord {
  id: string;
  targetAddress: string;
  assetCode: string;
  action: "FREEZE" | "UNFREEZE";
  status: "PENDING" | "APPROVED" | "EXECUTED" | "REJECTED";
  proposedBy: string;
  quorumRequired: number;
  approvalsCount: number;
  riskScore: number;
  incidentUri: string;
  createdAt: string;
}

const SAMPLE_ADDRESSES = [
  "GA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVAAA",
  "GBNDL7H7L5B2M77EQV6W32R3W6K47D2P25G5CVL45C4QZQ3R6T2QBAAA",
  "GC3K5B632KM5L4XQOAZ3W2K4D2P25G5CVL45C4QZQ3R6T2QBAAAMCAAA",
  "GD6W5F6YAZB4H2V7M9Q3P5R7S1T3V5X7Z9B2D4F6H8J1L3N5P7R9T1V3",
  "GAAZ3W2K4D2P25G5CVL45C4QZQ3R6T2QBAAAMCAAA7QYNF7SOWQ3GLR2",
];

const ASSETS = ["USDC", "EURC", "XLM", "REALESTATE01", "TREASURYBILL"];
const ACTIONS: ("FREEZE" | "UNFREEZE")[] = ["FREEZE", "UNFREEZE"];
const STATUSES: ("PENDING" | "APPROVED" | "EXECUTED" | "REJECTED")[] = [
  "PENDING",
  "APPROVED",
  "EXECUTED",
  "REJECTED",
];

export function generateMockRecords(count: number = 25): MockAuditRecord[] {
  const records: MockAuditRecord[] = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const target = SAMPLE_ADDRESSES[i % SAMPLE_ADDRESSES.length];
    const proposer = SAMPLE_ADDRESSES[(i + 1) % SAMPLE_ADDRESSES.length];
    const asset = ASSETS[i % ASSETS.length];
    const action = ACTIONS[i % ACTIONS.length];
    const status = STATUSES[i % STATUSES.length];
    const riskScore = Math.floor(Math.random() * 85) + 15;
    const offsetMs = i * 3600000; // 1 hour steps backwards

    records.push({
      id: crypto.randomUUID(),
      targetAddress: target,
      assetCode: asset,
      action,
      status,
      proposedBy: proposer,
      quorumRequired: 2,
      approvalsCount: status === "EXECUTED" ? 2 : status === "APPROVED" ? 2 : 1,
      riskScore,
      incidentUri: `ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi/${i + 1}`,
      createdAt: new Date(now - offsetMs).toISOString(),
    });
  }

  return records;
}

if (require.main === module) {
  const count = process.argv[2] ? parseInt(process.argv[2], 10) : 50;
  const data = generateMockRecords(count);
  const outPath = path.resolve(__dirname, "..", "mock-compliance-dataset.json");
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2), "utf-8");
  console.log(`Generated ${count} mock compliance records at ${outPath}`);
}

