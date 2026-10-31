#!/usr/bin/env bash
# Semantic Release Tagging and Verification Script for Unix / macOS

set -euo pipefail

VERSION="${1:-v1.0.0}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "=============================================="
echo " Stellar-Guard Release Verification & Tagging "
echo " Target Version: $VERSION                     "
echo "=============================================="

echo "[1/3] Running workspace test suites..."
npx --prefix "$ROOT_DIR/backend" jest "$ROOT_DIR/tests/workspace.test.js" "$ROOT_DIR/tests/codebase_tooling.test.js"

echo "[2/3] Verifying release WASM checksums..."
node "$ROOT_DIR/scripts/verify-checksums.js" generate

echo "[3/3] Preparing git release tag '$VERSION'..."
git tag -a "$VERSION" -m "Release $VERSION: Institutional CAP-0077 Freeze & RWA Asset Protection on Stellar"

echo "Release $VERSION created successfully."
echo "To push this release tag to GitHub, run: git push origin $VERSION"
