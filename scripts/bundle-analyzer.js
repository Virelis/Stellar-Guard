/**
 * Stellar-Guard Frontend Production Bundle Analyzer
 * Inspects Next.js compiled chunks to verify compliance with performance budgets.
 */

const fs = require("fs");
const path = require("path");

const CHUNKS_DIR = path.resolve(__dirname, "..", "frontend", ".next", "static", "chunks");
const BUDGET_KB = 350; // Performance budget per individual chunk

console.log("Analyzing Next.js production bundle chunks...");

if (!fs.existsSync(CHUNKS_DIR)) {
  console.log("No Next.js build output found at frontend/.next. Run 'npm run build' in frontend first.");
  process.exit(0);
}

function getFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      getFiles(fullPath, files);
    } else if (entry.name.endsWith(".js") || entry.name.endsWith(".css")) {
      files.push(fullPath);
    }
  }
  return files;
}

const files = getFiles(CHUNKS_DIR);
let totalSizeBytes = 0;
let exceededCount = 0;

console.log("------------------------------------------------------------------");
console.log(" Chunk Name                                     | Size    | Status");
console.log("------------------------------------------------------------------");

for (const file of files) {
  const stat = fs.statSync(file);
  totalSizeBytes += stat.size;
  const sizeKb = (stat.size / 1024).toFixed(1);
  const relName = path.relative(CHUNKS_DIR, file).padEnd(46);
  const status = stat.size > BUDGET_KB * 1024 ? "EXCEEDED" : "PASS";

  if (status === "EXCEEDED") {
    exceededCount++;
  }

  console.log(` ${relName} | ${sizeKb.padStart(6)} KB | ${status}`);
}

console.log("------------------------------------------------------------------");
console.log(`Total Chunks: ${files.length}`);
console.log(`Total Bundle Size: ${(totalSizeBytes / 1024 / 1024).toFixed(2)} MB`);
console.log(`Performance Budget: ${BUDGET_KB} KB per chunk`);
console.log(`Chunks Exceeding Budget: ${exceededCount}`);
console.log("------------------------------------------------------------------");

if (exceededCount > 0) {
  console.warn(`[WARN] ${exceededCount} chunk(s) exceeded the ${BUDGET_KB} KB performance budget.`);
} else {
  console.log("[SUCCESS] All chunks are within the performance budget.");
}

