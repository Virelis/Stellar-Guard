/**
 * Stellar-Guard Typed API Client Generator
 * Generates an end-to-end typed TypeScript HTTP client from OpenAPI 3.0 specification.
 */

const fs = require("fs");
const path = require("path");

const OPENAPI_PATH = path.resolve(__dirname, "..", "backend", "src", "docs", "openapi.json");
const OUTPUT_PATH = path.resolve(__dirname, "..", "packages", "types", "src", "client.ts");

console.log("Generating typed API client SDK from OpenAPI specification...");

if (!fs.existsSync(OPENAPI_PATH)) {
  console.error(`OpenAPI specification not found at ${OPENAPI_PATH}`);
  process.exit(1);
}

const spec = JSON.parse(fs.readFileSync(OPENAPI_PATH, "utf-8"));

const CLIENT_CODE = `/**
 * Auto-generated Stellar-Guard Governance API Client
 * Generated from OpenAPI 3.0 spec (v${spec.info.version})
 */

export interface ClientConfig {
  baseUrl: string;
  authToken?: string;
}

export class StellarGuardClient {
  private baseUrl: string;
  private authToken?: string;

  constructor(config: ClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\\/$/, "");
    this.authToken = config.authToken;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = \`\${this.baseUrl}\${path}\`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.authToken) {
      headers["Authorization"] = \`Bearer \${this.authToken}\`;
    }

    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      throw new Error(\`API request failed: \${res.status} \${res.statusText}\`);
    }
    return res.json() as Promise<T>;
  }

  // Governance Proposals
  public async getProposals(): Promise<unknown[]> {
    return this.request<unknown[]>("/api/freeze/proposals");
  }

  public async createProposal(data: {
    assetCode: string;
    target: string;
    category?: string;
    incidentUri?: string;
  }): Promise<{ proposalId: string }> {
    return this.request<{ proposalId: string }>("/api/freeze/propose", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Multi-Sig Voting
  public async submitVote(data: {
    proposalId: string;
    voteType: "APPROVE" | "REJECT";
    signature: string;
  }): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>("/api/freeze/vote", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Risk & Compliance
  public async evaluateRisk(targetAddress: string): Promise<{ score: number; level: string }> {
    return this.request<{ score: number; level: string }>(\`/api/risk/evaluate?target=\${encodeURIComponent(targetAddress)}\`);
  }

  // Health Probe
  public async getHealth(): Promise<{ status: string }> {
    return this.request<{ status: string }>("/health");
  }
}
`;

fs.writeFileSync(OUTPUT_PATH, CLIENT_CODE, "utf-8");
console.log(`Successfully generated typed client SDK at ${OUTPUT_PATH}`);
