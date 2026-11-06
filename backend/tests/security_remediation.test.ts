import request from "supertest";
import * as StellarSdk from "@stellar/stellar-sdk";
import app from "../src/index";
import { signAuthToken, verifyAuthToken } from "../src/middleware/auth";
import { isSafeWebhookUrl } from "../src/utils/ssrfValidator";
import { buildChallengeTx, verifyChallengeTx } from "../src/services/sep10Service";

describe("Security Remediation & Access Control Verification", () => {
  describe("1. Fail-Closed Authentication & Constant-Time Token Verification (SG-01, SG-07)", () => {
    it("should generate and verify valid JWT tokens", () => {
      const token = signAuthToken(
        "GBYAB3VLBSHUCXGZTLIHVT3VXBOIXUYJMJF7UTSIUOJCGSJDXZEWTDKH",
        "admin",
        3600
      );
      const payload = verifyAuthToken(token);
      expect(payload).not.toBeNull();
      expect(payload?.adminKey).toBe("GBYAB3VLBSHUCXGZTLIHVT3VXBOIXUYJMJF7UTSIUOJCGSJDXZEWTDKH");
      expect(payload?.role).toBe("admin");
    });

    it("should reject tampered or invalid signatures", () => {
      const token = signAuthToken(
        "GBYAB3VLBSHUCXGZTLIHVT3VXBOIXUYJMJF7UTSIUOJCGSJDXZEWTDKH",
        "admin",
        3600
      );
      const parts = token.split(".");
      const tampered = `${parts[0]}.${parts[1]}.invalidsignature`;
      expect(verifyAuthToken(tampered)).toBeNull();
    });

    it("should reject expired tokens", () => {
      const expiredToken = signAuthToken(
        "GBYAB3VLBSHUCXGZTLIHVT3VXBOIXUYJMJF7UTSIUOJCGSJDXZEWTDKH",
        "admin",
        -10
      );
      expect(verifyAuthToken(expiredToken)).toBeNull();
    });
  });

  describe("2. SEP-0010 Replay Attack Prevention (SG-04)", () => {
    it("should prevent replaying a verified challenge transaction", () => {
      const clientKp = StellarSdk.Keypair.random();
      const challenge = buildChallengeTx(clientKp.publicKey());

      const tx = StellarSdk.TransactionBuilder.fromXDR(
        challenge.transaction,
        challenge.networkPassphrase
      );
      tx.sign(clientKp);
      const signedXdr = tx.toXDR();

      // First verification must succeed
      const firstResult = verifyChallengeTx(signedXdr);
      expect(firstResult.valid).toBe(true);
      expect(firstResult.clientPublicKey).toBe(clientKp.publicKey());

      // Second verification of the exact same transaction must be blocked by replay protection
      const replayResult = verifyChallengeTx(signedXdr);
      expect(replayResult.valid).toBe(false);
      expect(replayResult.error).toContain("replay");
    });
  });

  describe("3. SSRF Protection on Webhook URLs (SG-03)", () => {
    it("should block loopback, cloud metadata, and link-local destinations", () => {
      expect(isSafeWebhookUrl("http://localhost/hook").valid).toBe(false);
      expect(isSafeWebhookUrl("http://127.0.0.1:4000/api/admin").valid).toBe(false);
      expect(isSafeWebhookUrl("http://169.254.169.254/latest/meta-data/").valid).toBe(false);
      expect(isSafeWebhookUrl("http://metadata.google.internal/computeMetadata/v1/").valid).toBe(
        false
      );
      expect(isSafeWebhookUrl("ftp://example.com/hook").valid).toBe(false);
    });

    it("should accept valid public URLs", () => {
      expect(isSafeWebhookUrl("https://hooks.slack.com/services/T00/B00/X00").valid).toBe(true);
      expect(isSafeWebhookUrl("https://api.example.com/stellar-guard-alert").valid).toBe(true);
    });

    it("should reject unsafe URLs in POST /api/webhooks", async () => {
      const res = await request(app)
        .post("/api/webhooks")
        .send({ url: "http://169.254.169.254/latest/meta-data/" });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
    });
  });

  describe("4. Role-Based Access Control on Administrative Routes (SG-02, SG-05)", () => {
    it("should allow admin token to access /api/admin/maintenance/status", async () => {
      const adminToken = signAuthToken(
        "GBYAB3VLBSHUCXGZTLIHVT3VXBOIXUYJMJF7UTSIUOJCGSJDXZEWTDKH",
        "admin",
        3600
      );
      const res = await request(app)
        .get("/api/admin/maintenance/status")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("ok");
    });

    it("should reject auditor role from accessing /api/admin/maintenance/run", async () => {
      const auditorToken = signAuthToken(
        "GBYAB3VLBSHUCXGZTLIHVT3VXBOIXUYJMJF7UTSIUOJCGSJDXZEWTDKH",
        "auditor",
        3600
      );
      const res = await request(app)
        .post("/api/admin/maintenance/run")
        .set("Authorization", `Bearer ${auditorToken}`)
        .send({ vacuum: false });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe("Forbidden");
    });

    it("should allow auditor role to export audit trail", async () => {
      const auditorToken = signAuthToken(
        "GBYAB3VLBSHUCXGZTLIHVT3VXBOIXUYJMJF7UTSIUOJCGSJDXZEWTDKH",
        "auditor",
        3600
      );
      const res = await request(app)
        .get("/api/audit/export")
        .set("Authorization", `Bearer ${auditorToken}`);

      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toContain("text/csv");
    });

    it("should reject unauthenticated request to /api/network/switch", async () => {
      process.env.AUTH_REQUIRED = "true";
      const res = await request(app).post("/api/network/switch").send({ network: "futurenet" });
      delete process.env.AUTH_REQUIRED;

      expect(res.status).toBe(401);
    });

    it("should reject unauthenticated and non-admin request to /api/integrations/dispatch", async () => {
      process.env.AUTH_REQUIRED = "true";
      const unauthRes = await request(app)
        .post("/api/integrations/dispatch")
        .send({
          provider: "discord",
          webhookUrl: "https://discord.com/api/webhooks/123/abc",
          data: {
            assetCode: "USDC",
            targetAddress: "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN",
            eventType: "FREEZE",
          },
        });
      delete process.env.AUTH_REQUIRED;
      expect(unauthRes.status).toBe(401);

      const auditorToken = signAuthToken(
        "GBYAB3VLBSHUCXGZTLIHVT3VXBOIXUYJMJF7UTSIUOJCGSJDXZEWTDKH",
        "auditor",
        3600
      );
      const auditorRes = await request(app)
        .post("/api/integrations/dispatch")
        .set("Authorization", `Bearer ${auditorToken}`)
        .send({
          provider: "discord",
          webhookUrl: "https://discord.com/api/webhooks/123/abc",
          data: {
            assetCode: "USDC",
            targetAddress: "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN",
            eventType: "FREEZE",
          },
        });
      expect(auditorRes.status).toBe(403);
    });

    it("should reject SSRF attack on /api/integrations/dispatch even with admin role", async () => {
      const adminToken = signAuthToken(
        "GBDEVIFVWB277NYUCGDUIWI2XNXOH4AC7WGBNHFQLIN5P5WZ74UHBSVV",
        "admin",
        3600
      );
      const res = await request(app)
        .post("/api/integrations/dispatch")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          provider: "discord",
          webhookUrl: "http://169.254.169.254/latest/meta-data/",
          data: {
            assetCode: "USDC",
            targetAddress: "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN",
            eventType: "FREEZE",
          },
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Blocked internal or cloud metadata destination");
    });

    it("should serve audit logs array on /api/audit/logs with normalized fields", async () => {
      const res = await request(app).get("/api/audit/logs");

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});
