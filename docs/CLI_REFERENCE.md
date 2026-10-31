# Stellar-Guard CLI Operator Reference Manual

`@stellar-guard/cli` is the institutional command-line administration tool for protocol operators, security analysts, and automated incident response scripts.

## Installation

```bash
# Global installation via npm
npm install -g @stellar-guard/cli

# Run via npx without installation
npx @stellar-guard/cli status
```

---

## Command Reference

### `stellar-guard status`
Queries the live on-chain Soroban contract state, registered administrators, circuit breaker, and quorum threshold.

```bash
stellar-guard status
stellar-guard status --network standalone --json
```

### `stellar-guard propose <targetAddress> [assetCode]`
Submits an emergency asset quarantine proposal.

```bash
stellar-guard propose GA7Q... USDC --category EXPLOIT_DRAIN --evidence ipfs://Qm...
```

### `stellar-guard vote <proposalId>`
Signs and submits a governance approval or rejection signature.

```bash
stellar-guard vote 4f5e... --approve
stellar-guard vote 4f5e... --reject
```

### `stellar-guard inspect <targetAddress | xdr>`
Inspects an on-chain account's trustlines, AML risk score, or validates transaction XDR.

```bash
stellar-guard inspect GA7Q...
stellar-guard inspect AAAA... --json
```
