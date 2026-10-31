#!/usr/bin/env bash
# Stellar-Guard Transient Storage & Cache Pruning Script for Unix / macOS

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "Purging transient development storage and caches..."

rm -f "$ROOT_DIR"/backend/*.db* "$ROOT_DIR"/backend/*.sqlite*
rm -rf "$ROOT_DIR/frontend/.next"
rm -rf "$ROOT_DIR/coverage"
rm -f "$ROOT_DIR"/*.tsbuildinfo "$ROOT_DIR"/backend/*.tsbuildinfo "$ROOT_DIR"/frontend/*.tsbuildinfo
rm -f "$ROOT_DIR/mock-compliance-dataset.json"

echo "Storage purge completed cleanly."

