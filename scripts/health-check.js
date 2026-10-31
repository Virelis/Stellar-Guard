/**
 * Stellar-Guard Multi-Service Health Diagnostic Utility
 * Checks connectivity and latency to Horizon, Soroban RPC, and Backend API endpoints.
 */

const http = require("http");
const https = require("https");

const ENDPOINTS = [
  { name: "Horizon (Testnet)", url: process.env.HORIZON_URL || "https://horizon-testnet.stellar.org/" },
  { name: "Soroban RPC (Testnet)", url: process.env.SOROBAN_RPC_URL || "https://soroban-testnet.stellar.org" },
  { name: "Backend API (Local)", url: process.env.BACKEND_URL || "http://localhost:4000/health" },
];

function pingEndpoint(endpoint) {
  return new Promise((resolve) => {
    const urlObj = new URL(endpoint.url);
    const client = urlObj.protocol === "https:" ? https : http;
    const start = performance.now();

    const isSoroban = endpoint.name.includes("Soroban");
    const options = {
      method: isSoroban ? "POST" : "GET",
      headers: isSoroban ? { "Content-Type": "application/json" } : {},
      timeout: 4000,
    };

    const req = client.request(endpoint.url, options, (res) => {
      const latencyMs = Math.round(performance.now() - start);
      resolve({
        name: endpoint.name,
        url: endpoint.url,
        status: res.statusCode,
        latencyMs,
        healthy: res.statusCode >= 200 && res.statusCode < 400,
      });
    });

    req.on("error", (err) => {
      const latencyMs = Math.round(performance.now() - start);
      resolve({
        name: endpoint.name,
        url: endpoint.url,
        status: "ERROR",
        latencyMs,
        healthy: false,
        error: err.message,
      });
    });

    req.on("timeout", () => {
      req.destroy();
      resolve({
        name: endpoint.name,
        url: endpoint.url,
        status: "TIMEOUT",
        latencyMs: 4000,
        healthy: false,
      });
    });

    if (isSoroban) {
      req.write(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getHealth" }));
    }
    req.end();
  });
}

async function runHealthCheck() {
  console.log("==================================================================");
  console.log(" Stellar-Guard Multi-Service Health & Latency Probe               ");
  console.log("==================================================================");

  const results = await Promise.all(ENDPOINTS.map(pingEndpoint));

  for (const res of results) {
    const statusStr = res.healthy ? `[OK ${res.status}]` : `[FAIL ${res.status}]`;
    const latStr = `${res.latencyMs}ms`.padStart(8);
    console.log(` ${statusStr.padEnd(12)} | ${res.name.padEnd(24)} | ${latStr} | ${res.url}`);
    if (res.error) {
      console.log(`               └─ ${res.error}`);
    }
  }

  console.log("------------------------------------------------------------------");
  const publicHealthy = results.filter((r) => r.name !== "Backend API (Local)").every((r) => r.healthy);
  if (publicHealthy) {
    console.log("All public Stellar network services operational.");
  } else {
    console.log("One or more external services are currently unreachable.");
  }
}

if (require.main === module) {
  runHealthCheck().catch(console.error);
}

module.exports = { pingEndpoint, ENDPOINTS };
