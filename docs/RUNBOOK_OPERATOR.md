# Compliance Officer Daily Operations Runbook

## 1. Shift Handover & Daily Routine Checklist

Every compliance officer beginning their rotation should execute the following checklist:

- [ ] **Step 1:** Navigate to the Operator Dashboard at `http://localhost:3000` (or production portal).
- [ ] **Step 2:** Connect your authorized Freighter admin wallet and verify the network badge displays **TESTNET** or **PUBLIC** with sub-second ping.
- [ ] **Step 3:** Inspect the **Active Proposals** counter. Review any pending quarantine proposals awaiting second-signature signoff.
- [ ] **Step 4:** Review the **Live AML Risk Stream** for accounts flagged with scores $> 85$.
- [ ] **Step 5:** Verify the **Circuit Breaker** status is displaying `NORMAL (ENGAGED: FALSE)`.

---

## 2. Conducting an Incident Investigation

When an AML alert or law enforcement inquiry occurs:

1. **Address Inspection:** Input the suspect's Stellar address (`GA7Q...`) into the search bar or run:
   ```bash
   stellar-guard inspect <SUSPECT_ADDRESS>
   ```
2. **Examine Counterparty Network:** Verify transaction flow and whether funds originated from high-risk mixers or sanctions clusters.
3. **Draft Evidence Dossier:** Compile relevant transaction hashes and documentation into a PDF, upload to IPFS, and copy the CID.
4. **Initiate Proposal:** Click **Emergency Freeze** in the header, input the address, asset code (e.g. `USDC`), category, and paste the IPFS CID.
5. **Notify Secondary Trustee:** Alert the secondary compliance officer via secure internal comms to review and sign.

