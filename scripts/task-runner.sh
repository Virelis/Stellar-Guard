#!/usr/bin/env bash
# Stellar-Guard Workspace Automation Task Runner for Unix / macOS

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# ANSI Color codes
CYAN='\033[0;36m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
  echo -e "${CYAN}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1" >&2
}

TASK="${1:-help}"

case "$TASK" in
  build)
    log_info "Building Soroban smart contracts..."
    cargo build --manifest-path "$ROOT_DIR/Cargo.toml" --release --target wasm32-unknown-unknown

    log_info "Building shared packages..."
    npm run build --workspace=@stellar-guard/types

    log_info "Compiling Backend TypeScript..."
    (cd "$ROOT_DIR/backend" && npx tsc --noEmit)

    log_info "Building Frontend..."
    (cd "$ROOT_DIR/frontend" && npm run build)

    log_success "All workspaces built successfully."
    ;;

  test)
    log_info "Executing Soroban contract tests..."
    cargo test --manifest-path "$ROOT_DIR/Cargo.toml"

    log_info "Executing Backend test suite..."
    (cd "$ROOT_DIR/backend" && npm test)

    log_info "Executing Frontend test suite..."
    (cd "$ROOT_DIR/frontend" && npm test)

    log_success "All test suites passed cleanly."
    ;;

  lint)
    log_info "Checking Rust formatting and clippy..."
    cargo fmt --manifest-path "$ROOT_DIR/Cargo.toml" --all -- --check
    cargo clippy --manifest-path "$ROOT_DIR/Cargo.toml" --all-targets -- -D warnings

    log_info "Checking code format..."
    npx prettier --check "packages/**/*.{ts,json}" "backend/src/**/*.{ts,json}" "frontend/src/**/*.{ts,tsx,json}"
    log_success "Lint verification passed."
    ;;

  format)
    log_info "Formatting Rust code..."
    cargo fmt --manifest-path "$ROOT_DIR/Cargo.toml" --all

    log_info "Formatting TypeScript and JSON..."
    npx prettier --write "packages/**/*.{ts,json}" "backend/src/**/*.{ts,json}" "frontend/src/**/*.{ts,tsx,json}"
    log_success "All code formatted."
    ;;

  clean)
    log_info "Cleaning build artifacts and cache..."
    cargo clean --manifest-path "$ROOT_DIR/Cargo.toml"
    rm -rf "$ROOT_DIR/frontend/.next" "$ROOT_DIR/backend/dist" "$ROOT_DIR/packages/types/dist"
    log_success "Workspace cleaned."
    ;;

  help|*)
    echo -e "${YELLOW}Stellar-Guard Workspace Task Runner${NC}"
    echo "Usage: ./scripts/task-runner.sh [build | test | lint | format | clean]"
    ;;
esac
