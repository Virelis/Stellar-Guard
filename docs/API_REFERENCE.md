# Stellar-Guard REST API Reference Specification

## Authentication

All administrative endpoints require an HTTP Bearer JWT token issued via SEP-0010 Stellar WebAuth:
```http
Authorization: Bearer <JWT_TOKEN>
```

---

## Endpoints

### 1. `GET /api/freeze/proposals`
Retrieves all active and historical freeze proposals.

**Response `200 OK`:**
```json
[
  {
    "id": "a17b474e-bc26-4026-9f1e-97c9675695f2",
    "assetCode": "USDC",
    "target": "GA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVAAA",
    "proposer": "GBNDL7H7L5B2M77EQV6W32R3W6K47D2P25G5CVL45C4QZQ3R6T2QBAAA",
    "category": "AML_HIGH_RISK",
    "currentVotes": 2,
    "requiredQuorum": 2,
    "isExecuted": true,
    "createdAt": 1730332800000,
    "expiresAt": 1732924800000
  }
]
```

---

### 2. `POST /api/freeze/propose`
Submits a new asset quarantine proposal.

**Request Body:**
```json
{
  "target": "GA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVAAA",
  "assetCode": "USDC",
  "category": "AML_HIGH_RISK",
  "incidentUri": "ipfs://bafybeig.../report"
}
```

---

### 3. `POST /api/freeze/vote`
Casts an affirmative or negative vote on a proposal.

**Request Body:**
```json
{
  "proposalId": "a17b474e-bc26-4026-9f1e-97c9675695f2",
  "voteType": "APPROVE",
  "signature": "b31df8be1f81b9322f13a9008eb275c5..."
}
```

---

### 4. `GET /api/risk/evaluate`
Calculates real-time AML risk score for a target address.

**Query Parameters:**
- `target`: Stellar G... address.

**Response `200 OK`:**
```json
{
  "targetAddress": "GA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVAAA",
  "riskScore": 92,
  "riskLevel": "CRITICAL",
  "factors": [
    { "code": "SANCTIONED_CLUSTER", "weight": 40 },
    { "code": "HIGH_VELOCITY", "weight": 30 }
  ]
}
```

