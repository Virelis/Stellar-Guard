# Contributing to Stellar-Guard

Thank you for contributing to Stellar-Guard! We welcome contributions to smart contracts, backend streaming infrastructure, the operator dashboard, and documentation.

---

## 1. Development Workflow

1. **Fork & Clone:** Clone your fork locally:
   ```bash
   git clone https://github.com/Virelis/Stellar-Guard.git
   cd Stellar-Guard
   ```
2. **Setup Workspaces:**
   ```bash
   npm install
   npm run build --workspace=@stellar-guard/types
   ```
3. **Branching Strategy:** Create a descriptive branch:
   - `feat/feature-name`
   - `fix/bug-description`
   - `docs/doc-update`
4. **Conventional Commits:** Adhere strictly to conventional commits:
   - `feat(contracts): implement unanimous super-quorum bypass`
   - `fix(backend): correct cursor checkpoint retention window`
   - `docs(readme): update testnet contract deployments`

---

## 2. Testing & Verification

Before submitting a Pull Request, all tests across the monorepo must pass:

```bash
# Run all workspace test suites
npm test

# Run Rust contract tests
cargo test --all

# Verify WASM binary size
./scripts/verify-wasm-size.sh
```

---

## 3. Code Standards

- **Rust:** Strict zero-warning clippy check (`cargo clippy --all-targets -- -D warnings`) and `cargo fmt`.
- **TypeScript:** Strict type checks (`tsc --noEmit`) and ESLint (`npm run lint`).
- **Security:** Never commit private keys, secrets, or unencrypted incident data. Refer to [SECURITY.md](SECURITY.md) for vulnerability disclosure.
