import express from "express";
import request from "supertest";
import app from "../src/index";
import {
  CorsConfigurationError,
  createCorsMiddleware,
  parseAllowedOrigins,
} from "../src/middleware/cors";
import { validateEnvironment } from "../src/utils/envValidator";

describe("CORS Origin Allowlist Hardening (#9)", () => {
  describe("Startup configuration validation", () => {
    it("refuses to start in production when ALLOWED_ORIGIN is empty or missing", () => {
      expect(() => parseAllowedOrigins(undefined, "production")).toThrow(CorsConfigurationError);
      expect(() => parseAllowedOrigins("", "production")).toThrow(CorsConfigurationError);
      expect(() => parseAllowedOrigins("   ", "production")).toThrow(CorsConfigurationError);
      expect(() =>
        createCorsMiddleware({ rawOrigin: "", nodeEnv: "production" })
      ).toThrow("ALLOWED_ORIGIN must be explicitly configured");
    });

    it("refuses to start when ALLOWED_ORIGIN contains wildcard '*'", () => {
      expect(() => parseAllowedOrigins("*", "production")).toThrow(CorsConfigurationError);
      expect(() => parseAllowedOrigins("*", "development")).toThrow(CorsConfigurationError);
      expect(() =>
        parseAllowedOrigins("https://guard.stellar.org, *", "production")
      ).toThrow("Wildcard origin");
    });

    it("rejects malformed URLs, unsupported schemes, and URLs with paths or queries", () => {
      expect(() => parseAllowedOrigins("not-a-valid-url", "production")).toThrow(
        CorsConfigurationError
      );
      expect(() => parseAllowedOrigins("ftp://guard.stellar.org", "production")).toThrow(
        CorsConfigurationError
      );
      expect(() =>
        parseAllowedOrigins("https://guard.stellar.org/dashboard", "production")
      ).toThrow(CorsConfigurationError);
      expect(() =>
        parseAllowedOrigins("https://guard.stellar.org?foo=bar", "production")
      ).toThrow(CorsConfigurationError);
    });

    it("accepts comma-separated valid HTTP(S) origins and surfaces errors in validateEnvironment", () => {
      const origins = parseAllowedOrigins(
        "https://guard.stellar.org, https://ops.virelis.io/",
        "production"
      );
      expect(origins).toEqual(["https://guard.stellar.org", "https://ops.virelis.io"]);

      const badEnvReport = validateEnvironment({
        NODE_ENV: "production",
        ALLOWED_ORIGIN: "*",
      });
      expect(badEnvReport.valid).toBe(false);
      expect(badEnvReport.errors.some((e) => e.includes("Wildcard"))).toBe(true);
    });

    it("prevents backend module bootstrap when imported with invalid production ALLOWED_ORIGIN", () => {
      const prevEnv = process.env.NODE_ENV;
      const prevOrigin = process.env.ALLOWED_ORIGIN;
      try {
        jest.resetModules();
        process.env.NODE_ENV = "production";
        process.env.ALLOWED_ORIGIN = "*";
        expect(() => {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          require("../src/middleware/cors");
        }).toThrow("Wildcard origin");
      } finally {
        if (prevEnv === undefined) {
          delete process.env.NODE_ENV;
        } else {
          process.env.NODE_ENV = prevEnv;
        }
        if (prevOrigin === undefined) {
          delete process.env.ALLOWED_ORIGIN;
        } else {
          process.env.ALLOWED_ORIGIN = prevOrigin;
        }
        jest.resetModules();
      }
    });
  });

  describe("Runtime request Origin enforcement", () => {
    it("returns 403 Forbidden without CORS headers for disallowed origins on the main app", async () => {
      const res = await request(app)
        .get("/health")
        .set("Origin", "https://malicious.attacker.example");

      expect(res.status).toBe(403);
      expect(res.body.error).toBe("ForbiddenOrigin");
      expect(res.headers["access-control-allow-origin"]).toBeUndefined();
    });

    it("returns 403 on preflight OPTIONS from disallowed origin and 204/200 for allowlisted origin", async () => {
      const prodApp = express();
      prodApp.use(
        createCorsMiddleware({
          rawOrigin: "https://dashboard.stellarguard.io",
          nodeEnv: "production",
        })
      );
      prodApp.get("/ping", (_req, res) => res.json({ ok: true }));

      const blockedPreflight = await request(prodApp)
        .options("/ping")
        .set("Origin", "https://evil.example.org")
        .set("Access-Control-Request-Method", "POST");
      expect(blockedPreflight.status).toBe(403);
      expect(blockedPreflight.headers["access-control-allow-origin"]).toBeUndefined();

      // Even localhost is blocked in production unless explicitly allowlisted
      const blockedLocalhost = await request(prodApp)
        .get("/ping")
        .set("Origin", "http://localhost:3000");
      expect(blockedLocalhost.status).toBe(403);

      const allowedRes = await request(prodApp)
        .get("/ping")
        .set("Origin", "https://dashboard.stellarguard.io");
      expect(allowedRes.status).toBe(200);
      expect(allowedRes.headers["access-control-allow-origin"]).toBe(
        "https://dashboard.stellarguard.io"
      );

      // Server-to-server requests with no Origin header remain allowed
      const serverToServer = await request(prodApp).get("/ping");
      expect(serverToServer.status).toBe(200);
    });
  });
});
