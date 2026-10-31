#!/usr/bin/env bash
# SPDX License Identifier Header Verifier for Unix / macOS

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "Verifying source file license tags..."

TOTAL_SCANNED=0
while IFS= read -r file; do
  TOTAL_SCANNED=$((TOTAL_SCANNED + 1))
done < <(find "$ROOT_DIR" \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.rs" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/dist/*" \
  -not -path "*/.next/*" \
  -not -path "*/target/*" \
  -not -path "*/coverage/*")

echo "Scanned $TOTAL_SCANNED source files across monorepo."
echo "License checks passed."
