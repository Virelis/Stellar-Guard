# Stellar-Guard Threat Model & Security Architecture

## 1. STRIDE Analysis Matrix

| Threat Category | Threat Description | Attack Vector | Stellar-Guard Architectural Mitigation |
| :--- | :--- | :--- | :--- |
| **Spoofing Identity** | Attacker impersonates an authorized compliance administrator to submit unauthorized freeze requests. | Stolen API tokens or forged HTTP requests. | **SEP-0010 WebAuth + Ed25519 signatures.** Server verifies on-chain admin status; contract verifies cryptographic signature bitmap directly on Soroban. |
| **Tampering with Data** | Attacker alters proposal parameters (e.g. changing target address or asset code after signature collection). | In-flight payload mutation or MITM attack. | **Evidence Hashing + Cryptographic Signatures.** Signers commit to the deterministic hash of `(proposal_id, target, asset_code, action_seq)`. Any alteration invalidates signatures. |
| **Repudiation** | Compliance admin denies having authorized a freeze that resulted in commercial damages. | Legal dispute or denial of responsibility. | **Immutable On-Chain Event Log.** Every vote and execution is permanently recorded in Soroban contract events with voter address and ledger sequence. |
| **Information Disclosure** | Competitor discovers ongoing AML investigation before formal quarantine. | Eavesdropping on unencrypted RPC feeds. | **IPFS CID Encryption.** Incident reports and evidentiary documents are encrypted with the compliance council's shared public key before upload. |
| **Denial of Service** | Malicious actor spams false proposals to exhaust contract storage or lock institutional treasury keys. | High-frequency proposal submission or griefing. | **Spam Cooldown + Whitelist Registry.** Core treasury keys cannot be targeted due to contract-level whitelist checks; proposals enforce monotonic sequence cooldowns. |
| **Elevation of Privilege** | Compromised lower-privilege auditor attempts to execute quarantine or alter admin thresholds. | Exploiting logic flaw in contract roles. | **Strict RBAC + Unanimous Super-Quorum.** Modifying administrator sets or threshold parameters requires super-quorum approval from existing administrators. |
