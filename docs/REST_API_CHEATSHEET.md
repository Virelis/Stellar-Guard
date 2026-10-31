# Stellar-Guard REST API Cheatsheet

Base URL: `http://localhost:4000` (Local) / `https://api.stellar-guard.dev` (Production)

---

## 1. Health & Network Diagnostics

```bash
# Check service health
curl -s http://localhost:4000/health

# Check readiness probe
curl -s http://localhost:4000/ready

# Prometheus metrics
curl -s http://localhost:4000/metrics
```

---

## 2. Governance & Proposals

```bash
# List all active freeze proposals
curl -s http://localhost:4000/api/freeze/proposals

# Propose an asset freeze
curl -s -X POST http://localhost:4000/api/freeze/propose \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "target": "GA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVAAA",
    "assetCode": "USDC",
    "category": "AML_HIGH_RISK",
    "incidentUri": "ipfs://bafybeig.../report"
  }'

# Cast an admin vote
curl -s -X POST http://localhost:4000/api/freeze/vote \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "proposalId": "<UUID>",
    "voteType": "APPROVE",
    "signature": "<HEX_SIGNATURE>"
  }'
```

---

## 3. Risk & Compliance Engine

```bash
# Evaluate risk score for an address
curl -s "http://localhost:4000/api/risk/evaluate?target=GA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVAAA"

# Pre-flight quarantine simulation
curl -s -X POST http://localhost:4000/api/freeze/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "target": "GA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVAAA",
    "assetCode": "USDC"
  }'
```

