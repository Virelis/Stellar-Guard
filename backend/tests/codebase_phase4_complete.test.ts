import { CircuitBreaker } from "../src/utils/circuitBreaker";
import { sanitizeHtml, sanitizeMemoText, isValidIncidentUri } from "../src/utils/sanitizer";
import { MemoryRateLimiterStore } from "../src/utils/rateLimiterStore";
import { calculateRequiredQuorum, StellarGuardClient } from "../../packages/types/src/index";

describe("Batch 12 & Phase 4 Codebase Infrastructure Verification", () => {
  test("CircuitBreaker trips to OPEN after threshold failures and rejects execution", async () => {
    const cb = new CircuitBreaker({ failureThreshold: 3, resetTimeoutMs: 1000, callTimeoutMs: 200 });
    expect(cb.getState()).toBe("CLOSED");

    const failingCall = async () => {
      throw new Error("Downstream RPC failure");
    };

    // 3 successive failures
    for (let i = 0; i < 3; i++) {
      await expect(cb.execute(failingCall)).rejects.toThrow("Downstream RPC failure");
    }

    expect(cb.getState()).toBe("OPEN");
    await expect(cb.execute(async () => "success")).rejects.toThrow(/CircuitBreaker is OPEN/);

    cb.reset();
    expect(cb.getState()).toBe("CLOSED");
  });

  test("Input sanitizer neutralizes XSS characters and validates incident URIs", () => {
    const dirtyHtml = '<script>alert("hack")</script>';
    expect(sanitizeHtml(dirtyHtml)).toBe("&lt;script&gt;alert(&quot;hack&quot;)&lt;&#x2F;script&gt;");

    const dirtyMemo = "Normal text\x00\x08with control characters";
    expect(sanitizeMemoText(dirtyMemo)).toBe("Normal textwith control characters");

    expect(isValidIncidentUri("ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi")).toBe(true);
    expect(isValidIncidentUri("https://compliance.institution.com/reports/101")).toBe(true);
    expect(isValidIncidentUri("javascript:alert(1)")).toBe(false);
  });

  test("Dynamic quorum calculator returns strictly bounded threshold counts", () => {
    expect(calculateRequiredQuorum(1, 66)).toBe(1);
    expect(calculateRequiredQuorum(3, 66)).toBe(2); // ceil(1.98) = 2
    expect(calculateRequiredQuorum(5, 66)).toBe(4); // ceil(3.3) = 4
    expect(calculateRequiredQuorum(5, 100)).toBe(5);
  });

  test("Sliding-window MemoryRateLimiterStore correctly throttles excessive requests", async () => {
    const store = new MemoryRateLimiterStore();
    const key = "test-client-ip";

    const res1 = await store.consume(key, 2, 500);
    expect(res1.allowed).toBe(true);
    expect(res1.remaining).toBe(1);

    const res2 = await store.consume(key, 2, 500);
    expect(res2.allowed).toBe(true);
    expect(res2.remaining).toBe(0);

    const res3 = await store.consume(key, 2, 500);
    expect(res3.allowed).toBe(false);
    expect(res3.remaining).toBe(0);
  });

  test("StellarGuardClient instantiates and defines governance API methods", () => {
    const client = new StellarGuardClient({ baseUrl: "http://localhost:4000" });
    expect(typeof client.getProposals).toBe("function");
    expect(typeof client.createProposal).toBe("function");
    expect(typeof client.submitVote).toBe("function");
    expect(typeof client.evaluateRisk).toBe("function");
    expect(typeof client.getHealth).toBe("function");
  });
});
