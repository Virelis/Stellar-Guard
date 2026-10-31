/**
 * Stellar-Guard Cryptographic & Database Performance Benchmark
 * Measures native Ed25519 verification throughput, SHA-256 evidence hashing,
 * and HMAC-SHA256 signature rates for high-throughput incident scenarios.
 */

const crypto = require("crypto");

console.log("==================================================================");
console.log(" Stellar-Guard Cryptographic Throughput Benchmark                ");
console.log("==================================================================");

// 1. Ed25519 Verification Benchmark using Node.js native crypto
const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");
const samplePayload = Buffer.from("STELLAR_GUARD_FREEZE_PROPOSAL_PAYLOAD_TEST_HASH_DATA");
const signature = crypto.sign(null, samplePayload, privateKey);

const ED25519_ITERATIONS = 1000;
const startEd = performance.now();

for (let i = 0; i < ED25519_ITERATIONS; i++) {
  const valid = crypto.verify(null, samplePayload, publicKey, signature);
  if (!valid) throw new Error("Verification failed unexpectedly");
}

const edElapsedMs = performance.now() - startEd;
const edOpsPerSec = ((ED25519_ITERATIONS / edElapsedMs) * 1000).toFixed(0);

console.log(`Ed25519 Verification:  ${ED25519_ITERATIONS} ops in ${edElapsedMs.toFixed(1)} ms (${edOpsPerSec} ops/sec)`);

// 2. SHA-256 Evidence Hashing Benchmark
const HASH_ITERATIONS = 10000;
const hashData = Buffer.from("QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco_EVIDENCE");
const startHash = performance.now();

for (let i = 0; i < HASH_ITERATIONS; i++) {
  crypto.createHash("sha256").update(hashData).digest();
}

const hashElapsedMs = performance.now() - startHash;
const hashOpsPerSec = ((HASH_ITERATIONS / hashElapsedMs) * 1000).toFixed(0);

console.log(`SHA-256 Hashing:        ${HASH_ITERATIONS} ops in ${hashElapsedMs.toFixed(1)} ms (${hashOpsPerSec} ops/sec)`);

// 3. HMAC-SHA256 Webhook Signing Benchmark
const HMAC_ITERATIONS = 5000;
const webhookSecret = "whsec_super_secret_institutional_key_12345";
const webhookPayload = JSON.stringify({ event: "asset.frozen", target: "GA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVAAA" });
const startHmac = performance.now();

for (let i = 0; i < HMAC_ITERATIONS; i++) {
  crypto.createHmac("sha256", webhookSecret).update(webhookPayload).digest("hex");
}

const hmacElapsedMs = performance.now() - startHmac;
const hmacOpsPerSec = ((HMAC_ITERATIONS / hmacElapsedMs) * 1000).toFixed(0);

console.log(`HMAC Webhook Signing:   ${HMAC_ITERATIONS} ops in ${hmacElapsedMs.toFixed(1)} ms (${hmacOpsPerSec} ops/sec)`);
console.log("------------------------------------------------------------------");
console.log("Benchmark verification completed successfully.");
