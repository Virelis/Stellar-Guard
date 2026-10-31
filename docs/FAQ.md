# Frequently Asked Questions (FAQ)

### Q1: How does Stellar-Guard prevent rogue employee or malicious admin freezes?
**A:** Stellar-Guard enforces an on-chain **Dual-Control Quorum** ($Q \ge 2$). No single key or employee possesses the capability to freeze an asset. At least two distinct cryptographic signatures from authorized administrators are strictly validated by the Soroban smart contract.

---

### Q2: Can a customer appeal an incorrect or false-positive freeze?
**A:** Yes. The protocol implements a formal **Unfreeze Workflow**. Customers submit identity or legal clearance documentation, which is hashed to IPFS. Two compliance officers sign the unfreeze transaction, restoring the customer's trustline.

---

### Q3: What happens if an admin key is lost or compromised?
**A:** Remaining honest administrators can trigger the **Emergency Circuit Breaker**, submit an admin key replacement proposal, and achieve consensus to safely evict the compromised key and onboard a new hardware key.

---

### Q4: Does Stellar-Guard increase transaction fees for normal users?
**A:** No. Stellar-Guard governance operates entirely off-path during normal transactions. Standard payment transfers settle with ordinary Stellar network fees (~0.00001 XLM). Only freeze proposals and audit telemetry invoke Soroban smart contracts.

---

### Q5: Is Stellar-Guard compatible with mainnet regulated stablecoins like Circle USDC?
**A:** Yes. Any Stellar asset that sets the `AUTH_CLAWBACK_ENABLED` or `AUTH_REVOCABLE` flag can integrate with Stellar-Guard as its designated governance execution controller.

