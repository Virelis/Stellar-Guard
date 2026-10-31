## Description
<!-- Provide a detailed summary of the changes proposed in this pull request and the rationale behind them. -->

## Associated Issue
Closes #<!-- Issue number if applicable -->

## Type of Change
- [ ] 🚀 New Feature (non-breaking change adding capability)
- [ ] 🐛 Bug Fix (non-breaking change addressing an issue)
- [ ] 🔒 Security Improvement (vulnerability remediation, access control, audit)
- [ ] ⚡ Performance Optimization (WASM size reduction, query optimization)
- [ ] 📖 Documentation Update (SEP-0008, runbooks, architecture)
- [ ] 🛠️ DevEx / Codebase Infrastructure (CI/CD, tooling, monorepo scripts)

## Stellar & Soroban Quality Checklist
- [ ] Smart Contracts: `cargo test` passes and coverage is maintained.
- [ ] WASM Size: Contract binary complies with the 64KB ledger limit (`npm run verify:wasm`).
- [ ] Security Invariants: No unauthenticated admin methods; dynamic quorum rules respected.
- [ ] Backend: Express API endpoints validated with Zod and tested (`npm test --workspace=stellar-guard-backend`).
- [ ] Frontend: Accessible (WCAG AA), responsive, and tested (`npm test --workspace=stellar-guard-frontend`).
- [ ] Types: `@stellar-guard/types` package updated and synchronized.
- [ ] Documentation: OpenAPI schema or markdown guides updated as necessary.

## Verification & Screenshots
<!-- Include steps to reproduce/verify, command outputs, or UI screenshots for frontend changes -->
