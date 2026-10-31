/**
 * Stellar-Guard Cryptographic Release Checksum Generator & Verifier
 * Generates and validates SHA-256 checksums for WASM smart contract releases
 * and deployment artifacts to ensure reproducibility and supply-chain integrity.
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT_DIR = path.resolve(__dirname, "..");
const WASM_DIR = path.join(ROOT_DIR, "target", "wasm32-unknown-unknown", "release");
const CHECKSUM_FILE = path.join(ROOT_DIR, "WASM_CHECKSUMS.sha256");

function calculateSha256(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(content).digest("hex");
}

function generateChecksums() {
  if (!fs.existsSync(WASM_DIR)) {
    console.log(`Directory not found: ${WASM_DIR}. Skipping release artifact checksumming.`);
    return;
  }

  const files = fs.readdirSync(WASM_DIR).filter((f) => f.endsWith(".wasm"));
  if (files.length === 0) {
    console.log("No .wasm files found to checksum.");
    return;
  }

  const lines = [];
  for (const file of files) {
    const fullPath = path.join(WASM_DIR, file);
    const hash = calculateSha256(fullPath);
    lines.push(`${hash}  ${file}`);
    console.log(` [HASH] ${file} -> ${hash}`);
  }

  fs.writeFileSync(CHECKSUM_FILE, lines.join("\n") + "\n", "utf-8");
  console.log(`Wrote ${files.length} checksum(s) to ${CHECKSUM_FILE}`);
}

function verifyChecksums() {
  if (!fs.existsSync(CHECKSUM_FILE)) {
    console.log("No WASM_CHECKSUMS.sha256 file present to verify. Generating now...");
    generateChecksums();
    return true;
  }

  const content = fs.readFileSync(CHECKSUM_FILE, "utf-8");
  const lines = content.trim().split("\n").filter(Boolean);
  let allValid = true;

  for (const line of lines) {
    const [expectedHash, fileName] = line.trim().split(/\s+/);
    const fullPath = path.join(WASM_DIR, fileName);

    if (!fs.existsSync(fullPath)) {
      console.warn(` [MISSING] File ${fileName} not found on disk.`);
      allValid = false;
      continue;
    }

    const actualHash = calculateSha256(fullPath);
    if (actualHash === expectedHash) {
      console.log(` [VALID] ${fileName}: SHA-256 match.`);
    } else {
      console.error(` [MISMATCH] ${fileName} failed checksum verification!`);
      allValid = false;
    }
  }

  return allValid;
}

if (require.main === module) {
  const mode = process.argv[2] || "verify";
  if (mode === "generate") {
    generateChecksums();
  } else {
    const valid = verifyChecksums();
    process.exit(valid ? 0 : 1);
  }
}

module.exports = { calculateSha256, generateChecksums, verifyChecksums };
