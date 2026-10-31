# Changelog

All notable changes to the Stellar-Guard platform are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.0] - 2026-10-31

### Added
- **Production Deployments:**
  - **Soroban Smart Contract:** Compiled, optimized (43.49 KB), and deployed `stellar-guard-contract` to Stellar Testnet at `CCM2U2RWZVKISBKOAUBCTSYA63GIYAVC4RRBZU4Q5KKY5ZOYN45LFYN4`.
  - **Contract Initialization:** Initialized multi-sig governance with 3 admin keys (`GC5MCM...`, `GA7BAG...`, `GCQ3OL...`) and quorum threshold of 2 on Stellar Testnet (`tx: bc20cb27...`).
  - **Frontend Deployment:** Deployed Next.js 14 operator dashboard to Vercel production at [https://frontend-ten-steel-13.vercel.app](https://frontend-ten-steel-13.vercel.app).
- **Governance & Legal Documentation:**
  - Added root `LICENSE` (MIT License) with full copyright notice.
  - Added root `CODE_OF_CONDUCT.md` adopting the Contributor Covenant standards.
  - Added root `CONTRIBUTING.md` outlining development, testing, and conventional commit workflows.
  - Added root `CHANGELOG.md` tracking all version releases.
  - Added visual UI showcase screenshots to `docs/screenshots/` (`dashboard.png` and `mobile_view.png`).
- **Repository Metadata:**
  - Configured repository topics on GitHub: `stellar`, `soroban`, `cap-0077`, `rwa`, `asset-protection`, `smart-contracts`, `multisig`, `nextjs`, `rust`, `compliance`.
  - Configured live production homepage URL on GitHub repository.

### Fixed
- **Continuous Integration (CI):**
  - **Node.js Monorepo Matrix CI & Lighthouse CI:** Generated and tracked root `package-lock.json` resolving missing dependency lockfile error during `actions/setup-node@v4` caching and `npm ci`.
  - **Backend & Monorepo Runtime Compatibility:** Upgraded GitHub Actions Node.js runner matrix to Node 22 across workflows to support native `node:sqlite` (`DatabaseSync`), fixing module resolution failures.
  - **Contract CI & Linter Compliance:** Formatted Rust contracts via `cargo fmt` and enabled crate-level clippy allowances for Soroban SDK macro expansion and parameter boundaries, ensuring `cargo clippy --all-targets -- -D warnings` and `cargo fmt --all -- --check` pass cleanly.
  - **Security & Vulnerability Audit:** Added `.cargo/audit.toml` and `--ignore` flags for known transitive Soroban SDK dependencies (`crypto-bigint`, `curve25519-dalek`, `time`).
  - **Contract CI:** Corrected WASM artifact verification check in `contract-ci.yml` from `governance_multisig.wasm` to `stellar_guard_contract.wasm`.
  - **Deployment Tooling:** Fixed WASM file path resolution in `scripts/deploy-contracts.ps1` and `scripts/deploy-contracts.sh`.
  - **Frontend CI & Vercel Deploy:** Added automatic production deployment step in `.github/workflows/frontend-deploy.yml` authenticated via GitHub secrets (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`).
  - **Security Policy:** Corrected repository issue tracker links in `SECURITY.md`.

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

