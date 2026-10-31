const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

describe("Batch 11 Codebase Tooling & DevEx Verification", () => {
  const rootDir = path.resolve(__dirname, "..");

  test("Schema exporter produces valid SQL DDL with expected tables", () => {
    const { exportSchema, SCHEMA_DDL } = require("../scripts/export-sqlite-schema.js");
    expect(SCHEMA_DDL).toContain("CREATE TABLE IF NOT EXISTS audit_log");
    expect(SCHEMA_DDL).toContain("CREATE TABLE IF NOT EXISTS webhook_subscriptions");
    expect(SCHEMA_DDL).toContain("CREATE TABLE IF NOT EXISTS risk_assessments");

    const tmpPath = path.join(rootDir, "test-schema.sql");
    exportSchema(tmpPath);
    expect(fs.existsSync(tmpPath)).toBe(true);
    fs.unlinkSync(tmpPath);
  });

  test("Native cryptographic benchmark script executes cleanly with exit code 0", () => {
    const scriptPath = path.join(rootDir, "scripts", "benchmark-crypto.js");
    const output = execSync(`node "${scriptPath}"`, { encoding: "utf-8" });
    expect(output).toContain("Ed25519 Verification");
    expect(output).toContain("SHA-256 Hashing");
    expect(output).toContain("HMAC Webhook Signing");
    expect(output).toContain("Benchmark verification completed successfully");
  });

  test("Incident drill simulation executes all 5 stages cleanly", () => {
    const scriptPath = path.join(rootDir, "scripts", "simulate-incident.js");
    const output = execSync(`node "${scriptPath}"`, { encoding: "utf-8" });
    expect(output).toContain("[STAGE 1] AML Risk Engine Detection");
    expect(output).toContain("[STAGE 2] Freeze Proposal Submission");
    expect(output).toContain("[STAGE 3] Multi-Admin Verification & Signature");
    expect(output).toContain("[STAGE 4] Quorum Threshold Satisfied - On-Chain Execution");
    expect(output).toContain("[STAGE 5] Audit Trail & SIEM Webhook Notification");
    expect(output).toContain("INCIDENT DRILL SIMULATION COMPLETED: SUCCESS");
  });

  test("GitHub Issue templates and PR template exist and have required fields", () => {
    const prTemplate = fs.readFileSync(path.join(rootDir, ".github", "PULL_REQUEST_TEMPLATE.md"), "utf-8");
    expect(prTemplate).toContain("Stellar & Soroban Quality Checklist");

    const bugTemplate = fs.readFileSync(path.join(rootDir, ".github", "ISSUE_TEMPLATE", "bug_report.yml"), "utf-8");
    expect(bugTemplate).toContain("Affected Component");

    const featureTemplate = fs.readFileSync(path.join(rootDir, ".github", "ISSUE_TEMPLATE", "feature_request.yml"), "utf-8");
    expect(featureTemplate).toContain("Feature Category");
  });

  test("Shared types package exports Soroban contract errors and mappings", () => {
    const typesDist = path.join(rootDir, "packages", "types", "dist", "index.js");
    expect(fs.existsSync(typesDist)).toBe(true);

    const types = require(typesDist);
    expect(types.SorobanContractErrorCode).toBeDefined();
    expect(types.SorobanContractErrorCode.NotInitialized).toBe(1);
    expect(types.SorobanContractErrorCode.Unauthorized).toBe(3);
    expect(typeof types.mapSorobanErrorToHttp).toBe("function");

    const httpMapping = types.mapSorobanErrorToHttp(types.SorobanContractErrorCode.Unauthorized);
    expect(httpMapping.status).toBe(403);
  });
});
