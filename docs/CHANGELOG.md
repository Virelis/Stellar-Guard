# Changelog

All notable changes to the Stellar-Guard platform are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-10-31

### Added
- **Soroban Smart Contracts:**
  - CAP-0077 multi-sig quarantine contract with dynamic percentage quorum calculation.
  - Emergency circuit breaker with super-quorum override and admin change tracking.
  - Storage rent management with automatic TTL renewal and temporary proposal pruning.
  - Property-based fuzzing test suites verifying voter count and quorum invariants.
- **Backend API & Streaming Engine:**
  - Persistent Horizon SSE cursor checkpointing with exponential backoff recovery.
  - Native SQLite synchronization with structured Winston logging and Prometheus metrics.
  - SEP-0010 Stellar WebAuth challenge verification and JWT issuance.
  - Real-time AML risk scoring engine and FATF Travel Rule parser.
  - Resilient CircuitBreaker wrapper protecting RPC network calls.
- **Operator Governance Dashboard:**
  - Next.js 14 App Router dashboard with WCAG AA compliance and dark/light mode persistence.
  - Freighter, Albedo, and xBull wallet integration with auto-reconnection state machine.
  - Interactive quorum progress meters, XDR inspectors, and transaction simulation modals.
  - Audit trail data table with client-side CSV/JSON export and PDF report generation.
- **Developer Tooling & Ecosystem:**
  - Standalone `@stellar-guard/cli` administration utility with status, propose, and vote commands.
  - Shared `@stellar-guard/types` package unifying contract, backend, and frontend schemas.
  - SEP-0001 `stellar.toml` metadata publishing contracts and regulated assets.
  - Multi-tier GitHub Actions matrix CI workflows and local Docker compose sandbox.
