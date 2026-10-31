#!/usr/bin/env bash
# Soroban WASM Bytecode Size Verifier for Unix / macOS

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WASM_DIR="$ROOT_DIR/target/wasm32-unknown-unknown/release"
MAX_SIZE_BYTES=65536 # 64 KB

echo "Checking Soroban WASM release bytecode sizes..."

if [ ! -d "$WASM_DIR" ]; then
  echo "Target directory not found. Compiling WASM first..."
  cargo build --manifest-path "$ROOT_DIR/Cargo.toml" --release --target wasm32-unknown-unknown
fi

WASM_FILES=("$WASM_DIR"/*.wasm)

if [ ${#WASM_FILES[@]} -eq 0 ] || [ ! -e "${WASM_FILES[0]}" ]; then
  echo "Error: No .wasm files found in $WASM_DIR" >&2
  exit 1
fi

ANY_EXCEEDED=0

for FILE in "${WASM_FILES[@]}"; do
  SIZE=$(wc -c < "$FILE")
  FILENAME=$(basename "$FILE")
  SIZE_KB=$(( SIZE / 1024 ))

  if [ "$SIZE" -le "$MAX_SIZE_BYTES" ]; then
    echo " [PASS] $FILENAME: $SIZE bytes (${SIZE_KB} KB) - within 64KB limit"
  else
    echo " [FAIL] $FILENAME: $SIZE bytes (${SIZE_KB} KB) - EXCEEDS 64KB limit!" >&2
    ANY_EXCEEDED=1
  fi
done

if [ "$ANY_EXCEEDED" -ne 0 ]; then
  echo "Error: One or more WASM contracts exceed the Stellar 64KB size limit." >&2
  exit 1
fi

echo "All WASM binaries passed size verification."
