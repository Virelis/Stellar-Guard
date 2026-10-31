# Real-World Asset (RWA) Case Studies on Stellar

Stellar is the leading network for institutional tokenization of Real-World Assets. This document examines three production deployment patterns utilizing Stellar-Guard for regulatory compliance.

---

## Case Study 1: Tokenized Short-Term US Treasury Bills (USTB)

- **Issuer:** Regulated Sovereign Debt Fund
- **Asset Code:** `USTB`
- **Volume:** \$250,000,000 On-Chain
- **Compliance Requirement:** SEC Rule 17a-24 and FinCEN SAR mandatory reporting.
- **Stellar-Guard Integration:**
  - Automated investor whitelist registry integration.
  - Quorum-governed yield distribution freeze if investor undergoes bankruptcy reorganization.
  - Multi-party signoff for secondary market transfers exceeding \$1M.

---

## Case Study 2: Fractional Commercial Real Estate

- **Asset Code:** `MANHATTAN01`
- **Underlying:** Class-A Commercial Office Tower
- **Compliance Challenge:** Local court-ordered tax liens or ownership disputes require temporary lockups.
- **Stellar-Guard Integration:**
  - Fast-track 1-hour quarantine proposal initiated upon municipal court notice.
  - Dual-custodian signoff prevents wrongful tenant or shareholder lockouts.

---

## Case Study 3: Verified Carbon Credits & Offsets

- **Asset Code:** `VERRA2026`
- **Issue:** Fraudulent double-spend or retirement fraud across external registries.
- **Stellar-Guard Integration:**
  - Real-time Oracle integration tracking Verra and Gold Standard retirement events.
  - Automated quarantine triggered if credits are simultaneously listed on competing chains.

