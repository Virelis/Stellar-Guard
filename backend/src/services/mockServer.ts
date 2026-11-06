import http from "http";

export interface MockServerInstance {
  url: string;
  port: number;
  close: () => Promise<void>;
}

export function startMockStellarServer(port = 0): Promise<MockServerInstance> {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      res.setHeader("Content-Type", "application/json");

      // Handle Horizon root info
      if (req.method === "GET" && req.url === "/") {
        res.writeHead(200);
        res.end(
          JSON.stringify({
            horizon_version: "2.28.0",
            core_latest_ledger: 543210,
            history_latest_ledger: 543210,
            current_protocol_version: 21,
            network_passphrase: "Test SDF Network ; September 2015",
          })
        );
        return;
      }

      // Handle Horizon account load
      if (req.method === "GET" && req.url?.startsWith("/accounts/")) {
        const accountId = req.url.split("/accounts/")[1]?.split("?")[0] ?? "unknown";
        res.writeHead(200);
        res.end(
          JSON.stringify({
            id: accountId,
            account_id: accountId,
            sequence: "123456789",
            subentry_count: 2,
            balances: [
              { asset_type: "native", balance: "1000.0000000" },
              { asset_type: "credit_alphanum4", asset_code: "USDC", balance: "5000.0000000" },
            ],
          })
        );
        return;
      }

      // Handle JSON-RPC Soroban requests
      if (req.method === "POST") {
        let body = "";
        req.on("data", (chunk) => (body += chunk));
        req.on("end", () => {
          try {
            const parsed = JSON.parse(body);
            if (parsed.method === "getLatestLedger") {
              res.writeHead(200);
              res.end(
                JSON.stringify({ jsonrpc: "2.0", id: parsed.id ?? 1, result: { sequence: 543210 } })
              );
              return;
            }
            if (parsed.method === "simulateTransaction") {
              res.writeHead(200);
              res.end(
                JSON.stringify({
                  jsonrpc: "2.0",
                  id: parsed.id ?? 1,
                  result: {
                    latestLedger: 543210,
                    results: [{ auth: [], xdr: "AAAAEAAAAAE=" }],
                  },
                })
              );
              return;
            }
          } catch {}

          // Default mock transaction submit response
          res.writeHead(200);
          res.end(
            JSON.stringify({
              successful: true,
              hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
              ledger: 543210,
            })
          );
        });
        return;
      }

      res.writeHead(404);
      res.end(JSON.stringify({ error: "Not Found" }));
    });

    server.listen(port, "127.0.0.1", () => {
      const addr = server.address() as any;
      const actualPort = addr.port;
      resolve({
        url: `http://127.0.0.1:${actualPort}`,
        port: actualPort,
        close: () => new Promise((done) => server.close(() => done())),
      });
    });
  });
}
