# 3-Minute Hackathon Judge Video Demo Script

**Total Runtime:** 03:00  
**Target Audience:** Stellar Drips Wave Judges, Ecosystem Auditors, Protocol Evaluators

---

### [00:00 - 00:30] Hook & Problem Statement
- **Visual:** Open on the Stellar-Guard Dashboard (`http://localhost:3000`) in dark mode showing live metric cards.
- **Narrator:** *"When institutions tokenize billions in real-world assets on Stellar, how do they freeze illicit funds without trusting a single point of failure? Today, single-key custody is a regulatory and security disaster waiting to happen. Introducing Stellar-Guard: institutional-grade multi-signature freeze governance powered by Soroban and CAP-0077."*

---

### [00:30 - 01:15] Architecture & Detection
- **Visual:** Click on the **Ledger Activity** tab showing real-time streaming payments from Horizon. Show the AML Risk Score card evaluating a flagged transaction.
- **Narrator:** *"Stellar-Guard connects directly to Stellar Horizon via a persistent SSE stream. When an anomalous pattern or sanctioned cluster is detected, our AML engine flags the address and initiates an on-chain proposal."*

---

### [01:15 - 02:15] The Multi-Sig Quorum Action
- **Visual:** Open the **Emergency Freeze** drawer. Input suspect account and attach IPFS evidence CID. Click Propose.
- **Visual:** Switch wallet or show Quorum Progress Meter update to `1 of 2 signatures (50%)`.
- **Visual:** Second administrator signs via Freighter. The progress meter animates to 100%, and the Soroban transaction executes on the ledger.
- **Narrator:** *"Notice that neither officer can freeze funds alone. Only when our 66% dynamic quorum threshold is satisfied does the Soroban contract trigger the CAP-0077 quarantine on-chain."*

---

### [02:15 - 03:00] Audit Readiness, CLI & Conclusion
- **Visual:** Click **Export PDF Audit Report**. Show the generated institutional incident certificate with XDR hashes.
- **Visual:** Switch to terminal and run `stellar-guard status --json`.
- **Narrator:** *"Complete audit trails, enterprise SIEM webhooks, and a standalone CLI. Stellar-Guard is production-ready, fully tested, and ready to secure the next generation of regulated assets on Stellar. Thank you!"*
