# CAP-0077 Quarantined Trustlines Specification & Soroban Governance

## 1. Abstract

CAP-0077 (Core Advancement Proposal 0077) introduces quarantined trustlines on the Stellar ledger, allowing token issuers to isolate illicit, stolen, or sanction-flagged token balances without disrupting innocent counterparty trustlines or liquidating entire orderbooks.

**Stellar-Guard** implements an on-chain multi-signature governance protocol that acts as the trusted execution engine for CAP-0077 quarantine actions.

---

## 2. Protocol Specification

### 2.1 State Representation

The Soroban smart contract represents quarantined trustline states using deterministic ledger storage keys:

$$\text{QuarantineKey} = (\text{AssetCode}, \text{Issuer}, \text{TargetAccount})$$

```rust
pub struct QuarantinedAsset {
    pub target: Address,
    pub asset_code: Symbol,
    pub issuer: Address,
    pub frozen_at_ledger: u32,
    pub frozen_at_timestamp: u64,
    pub quorum_signers: Vec<Address>,
    pub action_seq: u64,
}
```

### 2.2 Quorum Invariant

Quarantine execution requires satisfaction of the dynamic percentage quorum rule:

$$\text{RequiredVotes} = \left\lceil \frac{|\text{Admins}| \times \text{ThresholdPercent}}{100} \right\rceil$$

Where:
- $|\text{Admins}| \ge 3$ for enterprise deployments.
- $\text{ThresholdPercent} \in [51, 100]$.
- A minimum of 2 affirmative administrator signatures is strictly required.

---

## 3. Threat Mitigations

| Threat Vector | Protocol Mitigation |
| :--- | :--- |
| **Compromised Admin Key** | Single admin cannot execute quarantine; quorum required ($M \ge 2$). |
| **Ransomware / Denial of Service** | Whitelist registry protects core infrastructure accounts from freeze. |
| **Replay Attacks** | Deterministic monotonic sequence numbers (`action_seq`) prevent replay. |
| **Unbounded Storage Growth** | Soroban storage rent management automatically prunes expired proposal state. |
