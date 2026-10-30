#!/usr/bin/env bash
# scripts/test-contracts.sh - Automated Soroban contract test runner
set -euo pipefail

echo "Running Stellar Guard Soroban smart contract test suite..."

# Use single-threaded execution to ensure deterministic snapshot assertions
cargo test -- --test-threads=1

echo "All contract unit and integration tests passed successfully!"
