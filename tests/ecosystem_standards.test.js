const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

describe("Batch 13 Ecosystem Standards & CLI Verification", () => {
  const rootDir = path.resolve(__dirname, "..");

  test("stellar.toml complies with SEP-0001 standards", () => {
    const tomlPath = path.join(rootDir, ".well-known", "stellar.toml");
    expect(fs.existsSync(tomlPath)).toBe(true);

    const content = fs.readFileSync(tomlPath, "utf-8");
    expect(content).toContain('VERSION = "2.0.0"');
    expect(content).toContain("[DOCUMENTATION]");
    expect(content).toContain("SIGNING_KEY =");
    expect(content).toContain("[[CONTRACTS]]");
    expect(content).toContain("[[CURRENCIES]]");
    expect(content).toContain('code = "USDC"');
    expect(content).toContain('code = "EURC"');
  });

  test("CLI binary entry point is executable and responds to version flag", () => {
    const cliBin = path.join(rootDir, "packages", "cli", "bin", "stellar-guard");
    expect(fs.existsSync(cliBin)).toBe(true);

    const versionOut = execSync(`node "${cliBin}" --version`, { encoding: "utf-8" });
    expect(versionOut).toContain("stellar-guard v1.0.0");

    const helpOut = execSync(`node "${cliBin}" --help`, { encoding: "utf-8" });
    expect(helpOut).toContain("Stellar-Guard Enterprise CLI");
    expect(helpOut).toContain("COMMANDS:");
    expect(helpOut).toContain("status");
    expect(helpOut).toContain("propose");
    expect(helpOut).toContain("vote");
  });

  test("CLI subcommands status and inspect execute cleanly", () => {
    const cliBin = path.join(rootDir, "packages", "cli", "bin", "stellar-guard");

    const statusOut = execSync(`node "${cliBin}" status --json`, { encoding: "utf-8" });
    const statusData = JSON.parse(statusOut);
    expect(statusData.contractAddress).toBeDefined();
    expect(statusData.quorumThreshold).toBe(2);
    expect(statusData.admins.length).toBeGreaterThanOrEqual(3);

    const inspectOut = execSync(`node "${cliBin}" inspect GA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVAAA --json`, {
      encoding: "utf-8",
    });
    const inspectData = JSON.parse(inspectOut);
    expect(inspectData.type).toBe("ACCOUNT_AUDIT");
    expect(inspectData.riskScore).toBeDefined();
  });

  test("All ecosystem documentation files exist and are populated", () => {
    const docs = [
      "docs/SEP_0008_REGULATED_ASSETS.md",
      "docs/CAP_0077_QUARANTINE_SPEC.md",
      "docs/SEP_0010_WEBAUTH_GUIDE.md",
      "docs/CLI_REFERENCE.md",
      "docs/INSTITUTIONAL_ONBOARDING.md",
      "docs/SECURITY_AUDIT_REPORT.md",
      "docs/DISASTER_RECOVERY_RUNBOOK.md",
      "docs/RWA_CASE_STUDIES.md",
      "docs/COMPLIANCE_FLOWCHARTS.md",
      "docs/SOROBAN_COST_OPTIMIZATION.md",
      "docs/REST_API_CHEATSHEET.md",
    ];

    for (const doc of docs) {
      const fullPath = path.join(rootDir, doc);
      expect(fs.existsSync(fullPath)).toBe(true);
      const stat = fs.statSync(fullPath);
      expect(stat.size).toBeGreaterThan(100);
    }
  });
});

