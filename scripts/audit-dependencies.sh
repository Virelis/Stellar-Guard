#!/usr/bin/env bash
# Monorepo Dependency Health and Vulnerability Auditor for Unix / macOS

set -uo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "=============================================="
echo " Stellar-Guard Dependency Health & Security   "
echo "=============================================="

echo "[1/2] Auditing Cargo smart contract dependencies..."
if cargo audit --manifest-path "$ROOT_DIR/Cargo.toml" 2>/dev/null; then
  echo " [PASS] No RustSec security advisories detected."
else
  echo " [WARN] Cargo audit completed with warnings or advisories."
fi

echo "[2/2] Auditing Node.js npm dependencies..."
if npm audit --prefix "$ROOT_DIR" --audit-level=high; then
  echo " [PASS] No high-severity npm vulnerabilities detected."
else
  echo " [WARN] NPM audit completed with non-zero exit code."
fi

echo "Dependency audit finished."

