# Soroban Contract Deployment Guide: Testnet, Futurenet & Mainnet

This guide documents deploying `governance_multisig` using the official `stellar` CLI.

---

## 1. Network Configuration

Add the target networks to your Stellar CLI profile:

```bash
# Stellar Testnet
stellar network add \
  --global testnet \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015"

# Stellar Futurenet
stellar network add \
  --global futurenet \
  --rpc-url https://rpc-futurenet.stellar.org \
  --network-passphrase "Test SDF Future Network ; October 2022"
```

---

## 2. Deploying the WASM Bytecode

```bash
# 1. Install contract WASM onto the ledger
WASM_HASH=$(stellar contract install \
  --wasm target/wasm32-unknown-unknown/release/governance_multisig.wasm \
  --network testnet \
  --source admin_key)

echo "Installed WASM Hash: $WASM_HASH"

# 2. Deploy contract instance
CONTRACT_ID=$(stellar contract deploy \
  --wasm-hash $WASM_HASH \
  --network testnet \
  --source admin_key)

echo "Deployed Contract ID: $CONTRACT_ID"
```

---

## 3. Contract Initialization

```bash
stellar contract invoke \
  --id $CONTRACT_ID \
  --network testnet \
  --source admin_key \
  -- \
  initialize \
  --admins '[ "GA7Q...", "GBND...", "GC3K..." ]' \
  --threshold_percent 66
```

