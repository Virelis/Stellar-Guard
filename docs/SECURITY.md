# Stellar-Guard Security Policy & Vulnerability Disclosure

## 1. Reporting Security Vulnerabilities

We take the security of the Stellar-Guard platform, our smart contracts, and the institutional funds protected by our protocol seriously.

If you discover a security vulnerability, **please do not open a public GitHub issue**. Instead, submit a confidential report to our security engineering team:

- **Email:** `security@stellar-guard.dev`
- **PGP Fingerprint:** `4A7F 92B1 C83E 55D0 1029 8A24 991F 7B12 3094 E8D2`
- **GitHub Security Advisory:** Submit a private advisory via `https://github.com/Virelis/Stellar-Guard/security/advisories/new`

---

## 2. Response Timeline & SLA

| Phase | Target SLA |
| :--- | :--- |
| **Initial Acknowledgment** | Within 24 hours |
| **Triage & Severity Rating** | Within 48 hours |
| **Fix Deployment & Advisory** | Within 7 days (Critical) / 14 days (High) |

---

## 3. Bug Bounty Scope

Eligible targets for our security bounty program:
- **In Scope:** Soroban smart contracts (`contracts/**`), cryptographic verification routines, quorum bypass exploits, replay vulnerabilities, unauthorized privilege escalation, and SQL injection flaws in the backend.
- **Out of Scope:** Social engineering attacks against team members, denial of service against public demo endpoints, and known mock testnet issues.

