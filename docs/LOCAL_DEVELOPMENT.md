# Local Development & Quickstart Guide

Get the complete Stellar-Guard platform running locally in under 3 minutes.

---

## 1. Quick Launch via Docker Compose (Recommended)

The easiest way to run the full stack (Standalone Stellar Node + Backend API + Next.js UI):

```bash
docker compose up -d
```
- **Operator UI:** `http://localhost:3000`
- **Backend API:** `http://localhost:4000`
- **Local Soroban RPC:** `http://localhost:8000/soroban/rpc`

---

## 2. Manual Monorepo Setup

If developing locally without Docker:

```bash
# 1. Install root and workspace dependencies
npm install

# 2. Build the shared types package
npm run build --workspace=@stellar-guard/types

# 3. Compile Soroban contracts
cargo build --release --target wasm32-unknown-unknown

# 4. Launch Backend in development mode
cd backend && npm run dev

# 5. Launch Frontend (in separate terminal)
cd frontend && npm run dev
```

---

## 3. Running Test Suites

```bash
# Run all workspace test suites
npm test

# Run Windows task runner
.\scripts\task-runner.ps1 test

# Run Unix task runner
./scripts/task-runner.sh test
```
