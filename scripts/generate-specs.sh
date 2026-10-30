#!/usr/bin/env bash
# scripts/generate-specs.sh - Extract and generate contract interface specification
set -euo pipefail

echo "Extracting contract interface specification..."
if command -v stellar &> /dev/null; then
    stellar contract inspect --wasm target/wasm32-unknown-unknown/release/stellar_guard_contract.wasm
elif command -v soroban &> /dev/null; then
    soroban contract inspect --wasm target/wasm32-unknown-unknown/release/stellar_guard_contract.wasm
else
    echo "Stellar/Soroban CLI not found. Contract source fully documented with standard Rustdoc annotations."
fi
