#!/usr/bin/env bash
# Deploy freeze-governance contract across Stellar networks (Linux/macOS)
set -euo pipefail

NETWORK="${1:-testnet}"
IDENTITY="${2:-deployer}"
ADMINS="${3:-}"
WASM="target/wasm32-unknown-unknown/release/stellar_guard_contract.wasm"

echo "==> Target Network: $NETWORK"
echo "==> Deployer Identity: $IDENTITY"

echo "==> Building contract WASM bytecode..."
cargo build --release --target wasm32-unknown-unknown

OPTIMISED="${WASM%.wasm}.optimized.wasm"
if command -v stellar &> /dev/null; then
    echo "==> Optimizing WASM binary..."
    stellar contract optimize --wasm "$WASM"

    echo "==> Deploying to $NETWORK..."
    CONTRACT_ID=$(stellar contract deploy \
      --wasm "$OPTIMISED" \
      --source "$IDENTITY" \
      --network "$NETWORK")

    echo "Contract successfully deployed: $CONTRACT_ID"

    if [ -n "$ADMINS" ]; then
        echo "==> Initializing contract with admins..."
        stellar contract invoke \
          --id "$CONTRACT_ID" \
          --source "$IDENTITY" \
          --network "$NETWORK" \
          -- init \
          --admins "$ADMINS"
    fi

    if [ -f "../../backend/.env" ]; then
        echo "==> Updating backend .env..."
        sed -i.bak "s/^FREEZE_CONTRACT_ID=.*/FREEZE_CONTRACT_ID=$CONTRACT_ID/" "../../backend/.env" && rm -f "../../backend/.env.bak"
    fi
else
    echo "Notice: stellar CLI not in PATH. WASM compiled at $WASM"
fi
