const fs = require("fs");
const path = require("path");

describe("Batch 14 Documentation & Architectural Completeness Verification", () => {
  const rootDir = path.resolve(__dirname, "..");
  const docsDir = path.join(rootDir, "docs");

  const REQUIRED_DOCS = [
    "THREAT_MODEL.md",
    "WHITEPAPER.md",
    "ARCHITECTURE.md",
    "API_REFERENCE.md",
    "CONTRIBUTING.md",
    "CODE_OF_CONDUCT.md",
    "SECURITY.md",
    "CHANGELOG.md",
    "RUNBOOK_OPERATOR.md",
    "GLOSSARY.md",
    "FAQ.md",
    "SMART_CONTRACT_VERIFICATION.md",
    "LOCAL_DEVELOPMENT.md",
    "HARDWARE_WALLET_INTEGRATION.md",
    "SIEM_INTEGRATION.md",
    "COMPLIANCE_OFFICER_TRAINING.md",
    "STELLAR_ECOSYSTEM_IMPACT.md",
    "FUTURENET_AND_TESTNET_DEPLOYMENT.md",
    "GOVERNANCE_CHARTER.md",
  ];

  test("All required architecture, threat model, and governance documentation files exist", () => {
    for (const doc of REQUIRED_DOCS) {
      const fullPath = path.join(docsDir, doc);
      expect(fs.existsSync(fullPath)).toBe(true);

      const stat = fs.statSync(fullPath);
      expect(stat.size).toBeGreaterThan(200); // Substantial content
    }
  });

  test("Threat model contains complete STRIDE analysis table", () => {
    const threatModel = fs.readFileSync(path.join(docsDir, "THREAT_MODEL.md"), "utf-8");
    expect(threatModel).toContain("STRIDE Analysis Matrix");
    expect(threatModel).toContain("Spoofing Identity");
    expect(threatModel).toContain("Tampering with Data");
    expect(threatModel).toContain("Repudiation");
    expect(threatModel).toContain("Information Disclosure");
    expect(threatModel).toContain("Denial of Service");
    expect(threatModel).toContain("Elevation of Privilege");
  });

  test("Whitepaper defines formal mathematical dynamic quorum formulas", () => {
    const whitepaper = fs.readFileSync(path.join(docsDir, "WHITEPAPER.md"), "utf-8");
    expect(whitepaper).toContain("Dynamic Quorum Consensus Mathematics");
    expect(whitepaper).toContain("Minimum Dual-Control");
    expect(whitepaper).toContain("Strict Quorum Bound");
  });

  test("Governance charter defines voting thresholds and bylaws", () => {
    const charter = fs.readFileSync(path.join(docsDir, "GOVERNANCE_CHARTER.md"), "utf-8");
    expect(charter).toContain("Standard Quorum");
    expect(charter).toContain("Admin Set Modification");
    expect(charter).toContain("Emergency Circuit Breaker");
    expect(charter).toContain("Smart Contract Upgrades");
  });
});

