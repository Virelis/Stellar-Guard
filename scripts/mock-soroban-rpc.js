/**
 * Standalone Lightweight Soroban RPC Mock Server
 * Provides hermetic JSON-RPC 2.0 endpoints for offline integration testing.
 */

const http = require("http");

const PORT = process.env.MOCK_RPC_PORT ? parseInt(process.env.MOCK_RPC_PORT, 10) : 8000;

const server = http.createServer((req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200);
    res.end(JSON.stringify({ status: "healthy" }));
    return;
  }

  if (req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", () => {
      try {
        const payload = JSON.parse(body);
        const { method, id } = payload;
        let result = {};

        switch (method) {
          case "getHealth":
            result = { status: "healthy" };
            break;
          case "getNetwork":
            result = {
              friendbotUrl: "http://localhost:8000/friendbot",
              passphrase: "Standalone Network ; February 2017",
              protocolVersion: 21,
            };
            break;
          case "simulateTransaction":
            result = {
              minResourceFee: "100",
              cost: { cpuInsns: "150000", memBytes: "20480" },
              results: [{ auth: [], xdr: "AAAAAA==" }],
              latestLedger: 1000,
            };
            break;
          case "sendTransaction":
            result = {
              status: "PENDING",
              hash: "0000000000000000000000000000000000000000000000000000000000000001",
              latestLedger: 1000,
            };
            break;
          case "getTransaction":
            result = {
              status: "SUCCESS",
              latestLedger: 1001,
              resultXdr: "AAAAAA==",
            };
            break;
          case "getEvents":
            result = {
              events: [
                {
                  type: "contract",
                  ledger: 1001,
                  contractId: "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM",
                  id: "0000000000000001-0000000000",
                  topic: ["AAAADwAAAAVmcmVlemUAAAA="],
                  value: { xdr: "AAAAAA==" },
                  inSuccessfulContractCall: true,
                },
              ],
              latestLedger: 1001,
            };
            break;
          default:
            res.writeHead(400);
            res.end(JSON.stringify({ jsonrpc: "2.0", id, error: { code: -32601, message: "Method not found" } }));
            return;
        }

        res.writeHead(200);
        res.end(JSON.stringify({ jsonrpc: "2.0", id, result }));
      } catch (err) {
        res.writeHead(400);
        res.end(JSON.stringify({ jsonrpc: "2.0", error: { code: -32700, message: "Parse error" } }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: "Not found" }));
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Mock Soroban RPC Server listening on http://localhost:${PORT}`);
  });
}

module.exports = { server };
