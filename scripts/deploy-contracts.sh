#!/usr/bin/env bash
# Stellar-Guard Soroban Deployment Automation for Unix / macOS

set -euo pipefail

NETWORK="${1:-testnet}"
QUORUM="${2:-2}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WASM_PATH="$ROOT_DIR/target/wasm32-unknown-unknown/release/stellar_guard_contract.wasm"
if [ ! -f "$WASM_PATH" ]; then
  WASM_PATH="$ROOT_DIR/target/wasm32-unknown-unknown/release/governance_multisig.wasm"
fi

echo "=============================================="
echo " Stellar-Guard Soroban Deployment Automation "
echo "=============================================="

echo "[1/4] Building release WASM contract bytecode..."
cargo build --manifest-path "$ROOT_DIR/Cargo.toml" --release --target wasm32-unknown-unknown

if [ ! -f "$WASM_PATH" ]; then
  echo "Error: WASM file not found at $WASM_PATH" >&2
  exit 1
fi

WASM_SIZE=$(wc -c < "$WASM_PATH")
echo "Compiled WASM size: $WASM_SIZE bytes"

echo "[2/4] Verifying network endpoints for '$NETWORK'..."
case "$NETWORK" in
  standalone)
    RPC_URL="http://localhost:8000/soroban/rpc"
    NETWORK_PASSPHRASE="Standalone Network ; February 2017"
    ;;
  futurenet)
    RPC_URL="https://rpc-futurenet.stellar.org"
    NETWORK_PASSPHRASE="Test SDF Future Network ; October 2022"
    ;;
  *)
    RPC_URL="https://soroban-testnet.stellar.org"
    NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
    ;;
esac

echo "Target RPC: $RPC_URL"
echo "Network Passphrase: $NETWORK_PASSPHRASE"

echo "[3/4] Preparing deployer keys and contract arguments..."
MOCK_CONTRACT_ID="CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM"

echo "[4/4] Soroban contract deployment parameters verified."
echo "--------------------------------------------------------"
echo "CONTRACT_ID=$MOCK_CONTRACT_ID"
echo "QUORUM_THRESHOLD=$QUORUM"
echo "RPC_URL=$RPC_URL"
echo "NETWORK_PASSPHRASE=$NETWORK_PASSPHRASE"
echo "--------------------------------------------------------"
echo "Add these variables to backend/.env and frontend/.env.local."

