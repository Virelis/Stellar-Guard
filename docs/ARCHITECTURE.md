# Stellar-Guard System Architecture & Technical Design

## 1. Architectural Overview

Stellar-Guard is architected across four decoupled tiers designed for high availability, fault tolerance, and regulatory compliance.

```
+-------------------------------------------------------------------------+
|                        Tier 1: Client Application                       |
|   Next.js 14 App Router | React 18 | Tailwind CSS | Freighter API       |
+-------------------------------------------------------------------------+
                                    |
                          REST & Server-Sent Events
                                    |
+-------------------------------------------------------------------------+
|                     Tier 2: Backend Streaming Engine                    |
|   Express API | Node:sqlite | Prometheus Metrics | Horizon Monitor      |
+-------------------------------------------------------------------------+
                                    |
                         JSON-RPC 2.0 & Horizon SSE
                                    |
+-------------------------------------------------------------------------+
|                      Tier 3: Soroban Smart Contracts                    |
|   Rust | Dynamic Quorum | CAP-0077 Quarantine | Whitelist Guard         |
+-------------------------------------------------------------------------+
                                    |
                            Consensus Envelopes
                                    |
+-------------------------------------------------------------------------+
|                       Tier 4: Stellar Core Ledger                       |
|   SCP Consensus | Regulated Trustlines | Clawback Operations            |
+-------------------------------------------------------------------------+
```

---

## 2. Core Subsystems

### 2.1 Soroban Multisig Contract (`contracts/freeze-governance`)
- Implements proposal lifecycle state machine.
- Manages storage keys with automatic storage rent expiration.
- Enforces dynamic quorum threshold calculations.
- Exposes typed error codes for fine-grained debugging.

### 2.2 Streaming Event Bus (`backend/src/services/horizonMonitor.ts`)
- Maintains persistent HTTP stream against Stellar Horizon `/ledgers` and `/transactions`.
- Checkpoints stream cursor to SQLite to survive node restarts without data loss.
- Evaluates incoming payments against AML risk rules and flags high-velocity structuring.
- Broadcasts real-time events over Server-Sent Events (SSE) bus to connected operator dashboards.

### 2.3 Operator Dashboard (`frontend/src`)
- Dark/light institutional UI designed for compliance officers.
- Integrates Freighter, Albedo, and xBull wallet signing.
- Simulates transaction gas fees and state diffs prior to on-chain execution.
- Generates PDF audit reports and exports CSV audit ledgers.

