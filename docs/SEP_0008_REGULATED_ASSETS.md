# SEP-0008 Regulated Assets & Stellar-Guard Integration Guide

## 1. Executive Summary

SEP-0008 defines the standard protocol for regulated assets on the Stellar network. Financial institutions, stablecoin issuers, and Real World Asset (RWA) tokenizers must comply with statutory requirements, such as know-your-customer (KYC), anti-money laundering (AML), sanctions screening, and court-ordered account restrictions.

**Stellar-Guard** enhances SEP-0008 compliance by replacing single-admin authorization bottlenecks with **decentralized multi-signature governance** powered by Soroban smart contracts.

---

## 2. Architecture & Operational Flow

```
[ User Payment Request ]
          │
          ▼
[ SEP-0008 Approval Server ] ── (Queries) ──> [ Stellar-Guard AML Engine ]
          │                                              │
          │ (Clearance OK)                               │ (High Risk >85)
          ▼                                              ▼
[ Authorized Trustline ]                    [ Multi-Sig Freeze Proposal ]
                                                         │
                                                         ▼
                                            [ 2/3 Compliance Admin Quorum ]
                                                         │
                                                         ▼
                                            [ CAP-0077 Soroban Quarantine ]
```

### Key Phases:
1. **Pre-flight Screening:** Every regulated transaction submitted to the issuer's SEP-0008 approval server is evaluated against the Stellar-Guard AML risk engine.
2. **Quorum Trigger:** If the recipient address is identified in an active hack, sanctions list, or high-velocity mixer pattern, the approval server flags the transaction and dispatches a freeze proposal to Stellar-Guard.
3. **Multi-Signer Approval:** Two or more authorized compliance officers must cryptographically sign the proposal using their Freighter wallets or hardware keys.
4. **Execution:** Upon satisfying the quorum threshold, the Soroban contract invokes the asset issuer's clawback or freeze operation, quarantining the illicit funds immediately.

---

## 3. Compliance Invariants

- **No Single Point of Failure (SPOF):** No single internal actor or compromised private key can unilaterally freeze a regulated customer's account.
- **Audit Immutability:** Every freeze or unfreeze proposal carries an immutable IPFS evidence hash and ledger timestamp.
- **Automated Revocation:** If false-positive evidence is presented during the dispute period, admins can vote to unfreeze with equal quorum rigor.

