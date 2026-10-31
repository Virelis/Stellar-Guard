# Smart Contract Verification & Reproducible Build Guide

This guide enables security auditors, regulatory examiners, and third-party developers to independently build, verify, and test the `governance_multisig` Soroban contract from source.

---

## 1. Prerequisites

- **Rust:** Stable 1.80+ (`rustup default stable`)
- **Target:** `rustup target add wasm32-unknown-unknown`
- **Cargo Audit:** `cargo install cargo-audit`

---

## 2. Compiling the Contract

```bash
# Build the optimized release WASM binary
cargo build --release --target wasm32-unknown-unknown

# Verify binary existence and size (<64KB)
ls -lh target/wasm32-unknown-unknown/release/governance_multisig.wasm
./scripts/verify-wasm-size.sh
```

---

## 3. Running Test Suites

```bash
# Run all unit tests, integration tests, and fuzzing invariants
cargo test --verbose

# Run clippy with strict zero-warning policy
cargo clippy --all-targets -- -D warnings

# Verify formatting
cargo fmt --all -- --check
```

---

## 4. Cryptographic Bytecode Verification

```bash
# Generate and compare SHA-256 digest
node scripts/verify-checksums.js verify
```
The computed SHA-256 hash must match `WASM_CHECKSUMS.sha256` in the repository root.

