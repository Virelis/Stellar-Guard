# SEP-0010 Stellar WebAuth Authentication Guide

## 1. Overview

SEP-0010 specifies cryptographic authentication for Stellar accounts. Instead of relying on vulnerable passwords or shared secrets, operators authenticate to the Stellar-Guard platform by signing a cryptographically non-fungible challenge transaction using their **Ed25519** administrative key via Freighter or hardware wallets.

---

## 2. Authentication Handshake Flow

```
[ Operator Browser / CLI ]                    [ Stellar-Guard Backend API ]
            │                                               │
            │ 1. GET /api/auth/sep10/challenge?account=G... │
            │──────────────────────────────────────────────>│
            │                                               │
            │ 2. Return Challenge XDR Transaction           │
            │<──────────────────────────────────────────────│
            │                                               │
            │ 3. Sign Challenge with Operator Private Key   │
            │    (Freighter Wallet / Albedo)                │
            │                                               │
            │ 4. POST /api/auth/sep10/verify { txXdr }      │
            │──────────────────────────────────────────────>│
            │                                               │
            │ 5. Validate Ed25519 Signature & Return JWT    │
            │<──────────────────────────────────────────────│
```

### Protocol Steps:
1. **Challenge Generation:** The server builds a standard 0-amount manage data transaction signed by the server's key, with timebounds ($T \le 300\text{s}$) to prevent replay.
2. **Client Signing:** The operator's wallet signs the transaction envelope without broadcasting it to the Stellar ledger (zero network fees incurred).
3. **Verification & JWT Issuance:** The server verifies that the signature belongs to an authorized governance admin, generating a signed JWT token containing the operator's public address and governance privileges.
