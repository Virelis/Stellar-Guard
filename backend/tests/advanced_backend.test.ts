import * as StellarSdk from "@stellar/stellar-sdk";
import { registerWebhook, listWebhooks, deleteWebhook, signWebhookPayload, verifyWebhookSignature } from "../src/services/webhookService";
import { getActiveNetwork, switchNetwork, getAllNetworks } from "../src/services/networkManager";
import { TtlCache } from "../src/services/cache";
import { computeTransferAnalytics } from "../src/services/analytics";
import { verifyEd25519Signature, verifyAuthProof } from "../src/utils/cryptoVerify";
import { memoryMonitor } from "../src/services/memoryMonitor";
import { startMockStellarServer } from "../src/services/mockServer";
import axios from "axios";

describe("Advanced Backend Services Integration Suite", () => {
  describe("Webhook Management & Signatures (webhookService.ts)", () => {
    it("should register, sign, verify, and delete webhooks", () => {
      const hook = registerWebhook("https://test.example.com/webhook", "FREEZE_EXECUTED");
      expect(hook.id).toBeGreaterThan(0);
      expect(hook.url).toBe("https://test.example.com/webhook");

      const payload = JSON.stringify({ event: "FREEZE_EXECUTED", target: "GAAZI..." });
      const signature = signWebhookPayload(payload, hook.secret);
      expect(signature.startsWith("sha256=")).toBe(true);

      const isValid = verifyWebhookSignature(payload, signature, hook.secret);
      expect(isValid).toBe(true);

      const isInvalid = verifyWebhookSignature(payload, signature + "tampered", hook.secret);
      expect(isInvalid).toBe(false);

      const all = listWebhooks();
      expect(all.some((h) => h.id === hook.id)).toBe(true);

      const deleted = deleteWebhook(hook.id);
      expect(deleted).toBe(true);
    });
  });

  describe("Multi-Network Configuration (networkManager.ts)", () => {
    it("should retrieve active network and switch between profiles", () => {
      const initial = getActiveNetwork();
      expect(initial.name).toBe("testnet");

      const switched = switchNetwork("futurenet");
      expect(switched.name).toBe("futurenet");
      expect(getActiveNetwork().name).toBe("futurenet");

      // Switch back to testnet
      switchNetwork("testnet");
      expect(getActiveNetwork().name).toBe("testnet");

      expect(() => switchNetwork("non_existent_network")).toThrow("Unsupported network");
    });
  });

  describe("TTL In-Memory Cache (cache.ts)", () => {
    it("should cache values and deduplicate concurrent factory invocations", async () => {
      const cache = new TtlCache(100);
      cache.set("key1", "value1");
      expect(cache.get("key1")).toBe("value1");

      // Stampede deduplication: call getOrSet concurrently
      let invocations = 0;
      const factory = async () => {
        invocations++;
        await new Promise((r) => setTimeout(r, 20));
        return "expensive_result";
      };

      const [res1, res2, res3] = await Promise.all([
        cache.getOrSet("concurrent_key", factory),
        cache.getOrSet("concurrent_key", factory),
        cache.getOrSet("concurrent_key", factory),
      ]);

      expect(res1).toBe("expensive_result");
      expect(res2).toBe("expensive_result");
      expect(res3).toBe("expensive_result");
      expect(invocations).toBe(1); // Factory only invoked once!

      const stats = cache.getStats();
      expect(stats.hits).toBeGreaterThan(0);
    });
  });

  describe("Analytics Aggregator (analytics.ts)", () => {
    it("should aggregate transfer volume, calculate averages, and sort top participants", () => {
      const sampleTransfers = [
        { id: "1", from: "G_SENDER_1", to: "G_REC_1", amount: 100, asset: "USDC", ts: "2026-01-01" },
        { id: "2", from: "G_SENDER_1", to: "G_REC_2", amount: 200, asset: "USDC", ts: "2026-01-01" },
        { id: "3", from: "G_SENDER_2", to: "G_REC_1", amount: 50, asset: "EURC", ts: "2026-01-01" },
      ];

      const report = computeTransferAnalytics(sampleTransfers);
      expect(report.totalTransfers).toBe(3);

      const usdc = report.volumeByAsset.find((a) => a.asset === "USDC");
      expect(usdc?.totalVolume).toBe(300);
      expect(usdc?.transferCount).toBe(2);
      expect(usdc?.averageAmount).toBe(150);

      expect(report.topRecipients[0].address).toBe("G_REC_2"); // 200 > 150
      expect(report.topSenders[0].address).toBe("G_SENDER_1"); // 300 > 50
    });
  });

  describe("Cryptographic Signature Verification (cryptoVerify.ts)", () => {
    it("should sign and verify arbitrary challenge auth proofs", () => {
      const keypair = StellarSdk.Keypair.random();
      const challenge = "Sign this message to authenticate with Stellar-Guard Admin: 123456";
      const signatureBuffer = keypair.sign(Buffer.from(challenge, "utf8"));
      const sigBase64 = signatureBuffer.toString("base64");

      const valid = verifyAuthProof(keypair.publicKey(), challenge, sigBase64);
      expect(valid).toBe(true);

      const invalid = verifyAuthProof(keypair.publicKey(), "tampered message", sigBase64);
      expect(invalid).toBe(false);
    });
  });

  describe("Memory Monitoring (memoryMonitor.ts)", () => {
    it("should return valid heap and RSS memory stats", () => {
      const stats = memoryMonitor.getStats();
      expect(stats.rssMb).toBeGreaterThan(0);
      expect(stats.heapUsedMb).toBeGreaterThan(0);
      expect(stats.heapUtilizationPercent).toBeGreaterThan(0);
    });
  });

  describe("Embedded Mock Stellar Server (mockServer.ts)", () => {
    it("should respond to Horizon root and account queries offline", async () => {
      const mock = await startMockStellarServer(0);
      try {
        const rootRes = await axios.get(mock.url);
        expect(rootRes.data.horizon_version).toBe("2.28.0");
        expect(rootRes.data.network_passphrase).toBe("Test SDF Network ; September 2015");

        const accountRes = await axios.get(`${mock.url}/accounts/GAAZI4TCR3TY`);
        expect(accountRes.data.id).toBe("GAAZI4TCR3TY");
        expect(accountRes.data.balances.length).toBe(2);
      } finally {
        await mock.close();
      }
    });
  });
});

