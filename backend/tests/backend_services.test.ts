import { DatabaseSync } from "node:sqlite";
import { runMigrations, getMigrationVersion } from "../src/services/migrator";
import { metrics } from "../src/services/metrics";
import { signAuthToken, verifyAuthToken } from "../src/middleware/auth";
import {
  isValidEd25519PublicKey,
  isValidContractId,
  isValidAssetCode,
  validateFreezeRequest,
} from "../src/utils/stellarValidator";
import { recordAuditLog, queryAuditLogs } from "../src/services/auditService";
import { eventBus } from "../src/services/eventBus";

describe("Backend Services & Middleware Comprehensive Test Suite", () => {
  describe("Schema Migrations (migrator.ts)", () => {
    it("should initialize schema_migrations and apply all migrations idempotently", () => {
      const db = new DatabaseSync(":memory:");
      const appliedFirst = runMigrations(db);
      expect(appliedFirst).toBeGreaterThanOrEqual(3);
      expect(getMigrationVersion(db)).toBeGreaterThanOrEqual(3);

      // Running second time should apply 0 additional migrations
      const appliedSecond = runMigrations(db);
      expect(appliedSecond).toBe(0);
    });
  });

  describe("Authentication & JWT Signatures (auth.ts)", () => {
    it("should sign and verify valid admin JWTs", () => {
      const adminKey = "GBZXN7PIRZGNMHGA728R374MQDUET2KWGD";
      const token = signAuthToken(adminKey, "admin", 3600);
      expect(typeof token).toBe("string");
      expect(token.split(".").length).toBe(3);

      const payload = verifyAuthToken(token);
      expect(payload).not.toBeNull();
      expect(payload?.adminKey).toBe(adminKey);
      expect(payload?.role).toBe("admin");
    });

    it("should reject tampered or expired tokens", () => {
      const adminKey = "GBZXN7PIRZGNMHGA728R374MQDUET2KWGD";
      const token = signAuthToken(adminKey, "admin", 3600);
      const tampered = token.slice(0, -4) + "abcd";
      expect(verifyAuthToken(tampered)).toBeNull();

      // Expired token (expires -10s ago)
      const expired = signAuthToken(adminKey, "admin", -10);
      expect(verifyAuthToken(expired)).toBeNull();
    });
  });

  describe("Stellar Validation Utilities (stellarValidator.ts)", () => {
    it("should validate Ed25519 public keys", () => {
      const validKey = "GDNQHT2ETVXAVWA4SM2NF5OF64TBEBE4DTRVFK45DIFRC746QQPP2R4R";
      expect(isValidEd25519PublicKey(validKey)).toBe(true);
      expect(isValidEd25519PublicKey("INVALIDKEY123")).toBe(false);
      expect(isValidEd25519PublicKey("")).toBe(false);
    });

    it("should validate Soroban contract IDs", () => {
      const validContract = "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4";
      expect(isValidContractId(validContract)).toBe(true);
      expect(isValidContractId("GDNQHT2ETVXAVWA4SM2NF5OF64TBEBE4DTRVFK45DIFRC746QQPP2R4R")).toBe(
        false
      );
    });

    it("should validate asset codes according to Stellar specs", () => {
      expect(isValidAssetCode("USDC")).toBe(true);
      expect(isValidAssetCode("EURC")).toBe(true);
      expect(isValidAssetCode("XLM")).toBe(true);
      expect(isValidAssetCode("ASSET12CHARS")).toBe(true);
      expect(isValidAssetCode("TOOLONGASSETNAME13")).toBe(false);
      expect(isValidAssetCode("")).toBe(false);
    });

    it("should validate freeze request structures and reject self-freezes", () => {
      const validKey1 = "GDNQHT2ETVXAVWA4SM2NF5OF64TBEBE4DTRVFK45DIFRC746QQPP2R4R";
      const validKey2 = "GCYGUXOP36RFRMYHX2QDKBPRE6XCZNU3JIQDRVRUOKMDO4CGMSEANXJE";

      const validReq = validateFreezeRequest({
        assetCode: "USDC",
        issuer: validKey1,
        target: validKey2,
      });
      expect(validReq.valid).toBe(true);

      const selfFreeze = validateFreezeRequest({
        assetCode: "USDC",
        issuer: validKey1,
        target: validKey1,
      });
      expect(selfFreeze.valid).toBe(false);
      expect(selfFreeze.error).toContain("self-freeze prohibited");
    });
  });

  describe("Prometheus Metrics (metrics.ts)", () => {
    it("should record request durations and votes and format text export", () => {
      metrics.recordHttpRequest("GET", "/health", 200, 15);
      metrics.recordVote("USDC");
      metrics.recordFreeze("USDC");
      metrics.recordHorizonError();

      const text = metrics.getMetricsAsText();
      expect(text).toContain("process_uptime_seconds");
      expect(text).toContain('http_requests_total{method="GET",path="/health",status="200"}');
      expect(text).toContain('stellar_votes_cast_total{asset="USDC"}');
      expect(text).toContain('stellar_freezes_executed_total{asset="USDC"}');
      expect(text).toContain("stellar_horizon_stream_errors_total");
    });
  });

  describe("Audit Trail System (auditService.ts)", () => {
    it("should record and query audit logs with pagination", () => {
      const id = recordAuditLog({
        eventType: "TEST_EVENT",
        assetCode: "EURC",
        target: "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN",
        details: "Audit logging unit test",
      });
      expect(id).toBeGreaterThan(0);

      const result = queryAuditLogs({ eventType: "TEST_EVENT" });
      expect(result.total).toBeGreaterThanOrEqual(1);
      expect(result.logs.some((l) => l.eventType === "TEST_EVENT")).toBe(true);
    });
  });

  describe("Event Bus (eventBus.ts)", () => {
    it("should register and broadcast events without error", () => {
      const mockRes: any = {
        write: jest.fn(),
      };

      eventBus.registerClient(mockRes);
      expect(eventBus.getClientCount()).toBeGreaterThanOrEqual(1);

      eventBus.broadcast("VOTE_CAST", { asset: "USDC", count: 2 });
      expect(mockRes.write).toHaveBeenCalled();

      eventBus.removeClient(mockRes);
    });
  });
});
