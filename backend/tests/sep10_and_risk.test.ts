import request from "supertest";
import * as StellarSdk from "@stellar/stellar-sdk";
import app from "../src/index";
import { parseTransactionMemo } from "../src/utils/memoParser";
import { filterRegistry } from "../src/services/filterRegistry";
import { evaluateAccountRisk } from "../src/services/riskEngine";
import { formatDiscordAlert, formatSlackAlert } from "../src/services/notificationTemplates";
import { runDatabaseMaintenance } from "../src/services/dbMaintenance";

describe("Batch 6: SEP-0010, AML Risk, Simulation & Maintenance Integration", () => {
  const testKp = StellarSdk.Keypair.random();
  const validAccount = testKp.publicKey();

  describe("SEP-0010 WebAuth Endpoints (/api/auth)", () => {
    it("should return a challenge transaction with correct network and client domain", async () => {
      const res = await request(app).get("/api/auth/challenge").query({ account: validAccount });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("transaction");
      expect(res.body).toHaveProperty("networkPassphrase");
      expect(typeof res.body.transaction).toBe("string");
      expect(res.body.networkPassphrase).toBe(StellarSdk.Networks.TESTNET);
    });

    it("should reject invalid Stellar public key in challenge request", async () => {
      const res = await request(app)
        .get("/api/auth/challenge")
        .query({ account: "INVALID_KEY_123" });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
    });
  });

  describe("Transaction Memo Parser (memoParser.ts)", () => {
    it("should classify FATF travel rule, incident tickets, and hash memos correctly", () => {
      const tr = parseTransactionMemo("text", "TR-ABCD1234");
      expect(tr.category).toBe("travel_rule");
      expect(tr.referenceId).toBe("ABCD1234");

      const inc = parseTransactionMemo("text", "INC-98765");
      expect(inc.category).toBe("incident_ticket");
      expect(inc.referenceId).toBe("98765");

      const inv = parseTransactionMemo("text", "INV-INV54321");
      expect(inv.category).toBe("invoice");
      expect(inv.referenceId).toBe("INV54321");

      const hashHex = "a".repeat(64);
      const hashMemo = parseTransactionMemo("hash", hashHex);
      expect(hashMemo.category).toBe("hash_digest");
      expect(hashMemo.isCompliantFormat).toBe(true);
      expect(hashMemo.referenceId).toBe(`0x${hashHex}`);

      const numId = parseTransactionMemo("id", "998877");
      expect(numId.category).toBe("numeric_id");
      expect(numId.referenceId).toBe("998877");

      const empty = parseTransactionMemo(undefined, "");
      expect(empty.category).toBe("empty");
    });
  });

  describe("AML Risk Evaluation Engine (riskEngine.ts & /api/risk)", () => {
    it("should evaluate account risk profile and structure factors", () => {
      const assessment = evaluateAccountRisk(validAccount);
      expect(assessment.targetAddress).toBe(validAccount);
      expect(assessment.riskScore).toBeGreaterThanOrEqual(0);
      expect(["LOW", "MODERATE", "HIGH", "CRITICAL"]).toContain(assessment.riskLevel);
      expect(Array.isArray(assessment.factors)).toBe(true);
    });

    it("should expose risk assessment via GET /api/risk/score/:account", async () => {
      const res = await request(app).get(`/api/risk/score/${validAccount}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("riskScore");
      expect(res.body).toHaveProperty("riskLevel");
    });
  });

  describe("Event Filter Registry & Formatters (filterRegistry.ts & notificationTemplates.ts)", () => {
    it("should register filters and match governance events", () => {
      const filter = filterRegistry.addRule({
        name: "Test High-Value USDC Freeze",
        eventType: "freeze_executed",
        assetCode: "USDC",
        minAmount: 1000,
        enabled: true,
      });

      expect(filter.id).toBeDefined();

      const matched = filterRegistry.matchEvent({
        eventType: "freeze_executed",
        assetCode: "USDC",
        amount: 5000,
      });
      expect(matched.some((r) => r.id === filter.id)).toBe(true);

      const nonMatched = filterRegistry.matchEvent({
        eventType: "vote_cast",
        assetCode: "USDC",
        amount: 5000,
      });
      expect(nonMatched.some((r) => r.id === filter.id)).toBe(false);

      filterRegistry.removeRule(filter.id);
    });

    it("should format Discord and Slack alerts cleanly", () => {
      const alertData = {
        title: "Malicious Drain Quarantine Triggered",
        eventType: "freeze_executed" as const,
        assetCode: "EURC",
        targetAddress: validAccount,
        votesCurrent: 3,
        votesRequired: 3,
        riskScore: 92,
      };

      const discordPayload = formatDiscordAlert(alertData);
      expect(discordPayload.embeds[0].title).toContain("Stellar-Guard");
      expect(discordPayload.embeds[0].color).toBe(0xd32f2f); // Red

      const slackPayload = formatSlackAlert(alertData);
      expect(slackPayload.blocks.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Quarantine Simulation Endpoint (/api/freeze/simulate)", () => {
    const issuerKp = StellarSdk.Keypair.random();

    it("should reject self-freeze attempts when target equals issuer", async () => {
      const res = await request(app).post("/api/freeze/simulate").send({
        assetCode: "USDC",
        issuer: issuerKp.publicKey(),
        target: issuerKp.publicKey(),
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("SelfFreezeNotAllowed");
    });

    it("should preview quorum progress and fee estimates for valid target", async () => {
      const targetKp = StellarSdk.Keypair.random();
      const res = await request(app).post("/api/freeze/simulate").send({
        assetCode: "USDC",
        issuer: issuerKp.publicKey(),
        target: targetKp.publicKey(),
      });

      expect(res.status).toBe(200);
      expect(res.body.valid).toBe(true);
      expect(res.body).toHaveProperty("estimatedFeeStroops");
      expect(res.body).toHaveProperty("quorumThreshold");
    });
  });

  describe("Database Maintenance & Integrity Verification (/api/admin/maintenance)", () => {
    it("should execute integrity checks via dbMaintenance service", () => {
      const report = runDatabaseMaintenance(false);
      expect(report.status).toBe("ok");
      expect(report.integrity).toContain("ok");
      expect(report.databaseSizeBytes).toBeGreaterThan(0);
    });

    it("should expose status via GET /api/admin/maintenance/status", async () => {
      const res = await request(app).get("/api/admin/maintenance/status");
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("ok");
    });
  });
});
