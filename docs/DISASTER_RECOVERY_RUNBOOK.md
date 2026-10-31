# Disaster Recovery & Key Compromise Runbook

## 1. Scenario A: Compromised Administrator Private Key

If an operator suspects an administrator's private key has been compromised or leaked:

1. **Step 1: Emergency Freeze (Circuit Breaker)**
   Any surviving honest admin invokes emergency pause:
   ```bash
   stellar-guard trip-breaker --admin G...SURVIVING_KEY
   ```
2. **Step 2: Propose Admin Removal**
   Submit an administrative proposal to remove the compromised key:
   ```bash
   stellar-guard admin remove G...COMPROMISED_KEY
   ```
3. **Step 3: Multi-Admin Quorum Confirmation**
   Remaining honest admins cast approval votes to satisfy quorum.
4. **Step 4: Rotate New Key & Resume Breaker**
   Add the replacement cold storage key and disengage the circuit breaker.

---

## 2. Scenario B: Erroneous Freeze (False Positive Dispute)

If an innocent customer account is mistakenly quarantined:

1. Customer submits identity verification documents to compliance team.
2. Compliance officer opens an **Unfreeze Proposal** in the dashboard with dispute ticket CID.
3. Two independent compliance managers sign the unfreeze transaction.
4. Quorum triggers instant trustline restoration on the Stellar ledger.

