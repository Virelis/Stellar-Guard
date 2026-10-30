#!/usr/bin/env bash
# scripts/build-contracts.sh - Automated Soroban contract build and size audit
set -euo pipefail

echo "Building Stellar Guard Soroban smart contract for wasm32-unknown-unknown..."
cargo build --target wasm32-unknown-unknown --release

WASM_PATH="target/wasm32-unknown-unknown/release/stellar_guard_contract.wasm"
if [ -f "$WASM_PATH" ]; then
    BYTES=$(wc -c < "$WASM_PATH")
    KB=$((BYTES / 1024))
    echo "Success! Contract binary built at: $WASM_PATH (~$KB KB / $BYTES bytes)"
    if [ "$BYTES" -gt 65536 ]; then
        echo "Note: Binary exceeds 64 KB uncompressed, use soroban contract optimize for deployment."
    fi
else
    echo "Error: WASM artifact not found at $WASM_PATH" >&2
    exit 1
fi
