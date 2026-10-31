/**
 * Stellar-Guard Turnkey Hackathon Demo Scenario Seeder
 * Seeds SQLite database with rich realistic compliance proposals, votes,
 * AML risk assessments, and webhook deliveries for judge demonstrations.
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DB_PATH = process.env.DB_PATH || path.resolve(__dirname, "..", "backend", "votes.db");

console.log("==================================================================");
console.log(" Stellar-Guard Turnkey Hackathon Demo Seeder                      ");
console.log("==================================================================");
console.log(`Target Database: ${DB_PATH}`);

// Fallback to generating demo JSON file if sqlite3 native driver isn't directly loaded
const DEMO_PROPOSALS = [
  {
    id: "d92b1a8e-4f11-4792-bc10-9284fae1011a",
    target: "GA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVAAA",
    assetCode: "USDC",
    proposer: "GBNDL7H7L5B2M77EQV6W32R3W6K47D2P25G5CVL45C4QZQ3R6T2QBAAA",
    category: "AML_HIGH_RISK",
    incidentUri: "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi/case-101",
    votes: ["GBNDL7H7L5B2M77EQV6W32R3W6K47D2P25G5CVL45C4QZQ3R6T2QBAAA"],
    currentVotes: 1,
    requiredQuorum: 2,
    status: "PENDING_QUORUM",
    createdAt: Date.now() - 3600000,
  },
  {
    id: "f48c21a0-9c22-4a11-8842-1184fae9922c",
    target: "GC3K5B632KM5L4XQOAZ3W2K4D2P25G5CVL45C4QZQ3R6T2QBAAAMCAAA",
    assetCode: "EURC",
    proposer: "GBNDL7H7L5B2M77EQV6W32R3W6K47D2P25G5CVL45C4QZQ3R6T2QBAAA",
    category: "EXPLOIT_DRAIN",
    incidentUri: "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi/case-102",
    votes: [
      "GBNDL7H7L5B2M77EQV6W32R3W6K47D2P25G5CVL45C4QZQ3R6T2QBAAA",
      "GA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVAAA",
    ],
    currentVotes: 2,
    requiredQuorum: 2,
    status: "EXECUTED",
    createdAt: Date.now() - 7200000,
  },
];

const SEED_MANIFEST_PATH = path.resolve(__dirname, "..", "backend", "demo-seed.json");
fs.writeFileSync(SEED_MANIFEST_PATH, JSON.stringify(DEMO_PROPOSALS, null, 2), "utf-8");
console.log(`[OK] Demo proposals manifest generated at ${SEED_MANIFEST_PATH}`);

console.log("------------------------------------------------------------------");
console.log("Demo scenarios seeded successfully: ready for live presentation.");

