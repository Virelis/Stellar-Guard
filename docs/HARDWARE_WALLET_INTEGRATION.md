# Hardware Wallet Integration Guide (Ledger Nano / Stax)

For production institutional deployments, compliance administrators should store governance private keys inside air-gapped **Ledger** hardware devices rather than browser extension storage.

---

## 1. Setup Steps

1. **Install Stellar App on Ledger:**
   - Open Ledger Live on your workstation.
   - Install the latest **Stellar App** from the App Catalog.
   - Open the Stellar App on your Ledger device.
2. **Pair with Freighter Wallet:**
   - Open the Freighter browser extension.
   - Click Account Settings -> **Connect Hardware Wallet**.
   - Select **Ledger** via WebUSB/WebHID.
   - Confirm public key derivation path `m/44'/148'/0'`.
3. **Connect to Stellar-Guard:**
   - Navigate to the Stellar-Guard Operator Portal.
   - Click **Connect Wallet** in the top navigation bar.
   - Authorize Freighter connection.

---

## 2. Signing Multisig Proposals

When an admin casts an approval vote:
1. Freighter prompts for Ledger device confirmation.
2. The transaction hash and proposal details appear on the Ledger screen.
3. Verify the target address and quorum proposal ID.
4. Press both physical buttons on the Ledger device to approve the signature.
5. The cryptographic Ed25519 signature is transmitted to the Stellar-Guard backend and relayed to the Soroban contract.

