# Enterprise & Institutional Onboarding Guide

## 1. Introduction

Stellar-Guard is purpose-built for regulated financial institutions, fiat-backed stablecoin issuers, and real-world asset (RWA) protocols operating on Stellar.

---

## 2. Setup Prerequisites

1. **Stellar Issuer Account:** An issuing account with `AUTH_CLAWBACK_ENABLED` flag set on trustlines.
2. **Key Custody:** Minimum of 3 distinct hardware security modules (HSM) or Ledger devices for governance admins.
3. **Soroban Contract Deployment:** Deploy `governance_multisig.wasm` to the target Stellar network.

---

## 3. Governance Configuration

```
┌────────────────────────────────────────────────────────┐
│                   Stellar-Guard Node                   │
├──────────────────────────┬─────────────────────────────┤
│ Admin 1 (Chief Legal)    │ G...Key1 (Weight 1)         │
│ Admin 2 (Head of SecOps) │ G...Key2 (Weight 1)         │
│ Admin 3 (Risk Auditor)   │ G...Key3 (Weight 1)         │
├──────────────────────────┼─────────────────────────────┤
│ Dynamic Quorum           │ 66% (2 Affirmative Votes)   │
│ Timelock Delay           │ 3600 seconds (1 Hour)       │
│ Whitelist Registry       │ Reserves & Treasury Keys    │
└──────────────────────────┴─────────────────────────────┘
```

---

## 4. Integration with Core Banking / SIEM

- **Webhooks:** Register outbound webhooks in the Settings drawer with HMAC-SHA256 secrets.
- **Syslog / Splunk:** Ingest real-time JSON logs emitted by the backend monitor on stdout.
- **REST APIs:** Use the `@stellar-guard/types` SDK or OpenAPI client to integrate into internal ticketing systems (ServiceNow, Jira).

