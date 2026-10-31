# Stellar Drips Wave / SCF Official Hackathon Submission

## 1. Project Overview
- **Project Name:** Stellar-Guard
- **Tagline:** Institutional Multi-Signature Freeze Governance & Asset Protection for Regulated RWAs on Stellar
- **Repository:** https://github.com/Virelis/Stellar-Guard
- **Ecosystem Standards:** CAP-0077, SEP-0001, SEP-0008, SEP-0010, Soroban

---

## 2. Track Fit: Why Stellar-Guard is 100% Relevant to the Stellar Drips Wave

The Stellar Drips Wave focuses on high-impact projects that accelerate the real-world adoption of the Stellar network, especially in **regulated assets, institutional tokenization (RWA), payments, and developer infrastructure**.

Stellar-Guard directly addresses the most critical barrier facing institutional asset issuers today:
1. **The Single-Key Dilemma:** Regulated issuers need the ability to freeze illicit funds, but leaving freeze authority in a single private key creates a disastrous single point of failure (SPOF) vulnerable to insider attacks and key compromise.
2. **The Soroban Solution:** Stellar-Guard implements **CAP-0077 compliant multi-signature governance** on Soroban smart contracts. Quorum is enforced on-chain, requiring dual-control consensus from authorized trustees before any asset restriction can take effect.

---

## 3. Key Innovations & Differentiators

- **Dynamic Percentage Quorum Math:** Quorum dynamically scales with administrative body size while guaranteeing a mathematical lower bound of dual control ($Q \ge 2$).
- **Evidence-Bound Proposals:** Every quarantine proposal cryptographically binds an IPFS hash containing immutable legal or forensic evidence.
- **Off-Chain / On-Chain Parity:** Monitored via persistent Horizon SSE stream, calculated with real-time AML scoring, and executed deterministically on Soroban.
- **Production-Ready Full Stack:** Complete with Rust smart contracts, Node.js streaming backend, Next.js operator dashboard, and an official `@stellar-guard/cli`.
