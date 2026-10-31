/**
 * Stellar-Guard Dead Code and Unreferenced Component Scanner
 * Analyzes component imports across frontend and backend routes.
 */

const fs = require("fs");
const path = require("path");

const FRONTEND_SRC = path.resolve(__dirname, "..", "frontend", "src");
const COMPONENTS_DIR = path.join(FRONTEND_SRC, "components");

console.log("Scanning for orphaned frontend components and unreferenced exports...");

if (!fs.existsSync(COMPONENTS_DIR)) {
  console.log("No components directory found at frontend/src/components.");
  process.exit(0);
}

function getAllFiles(dir, exts = [".ts", ".tsx", ".js", ".jsx"], files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "node_modules" && entry.name !== ".next") {
        getAllFiles(full, exts, files);
      }
    } else if (exts.some((ext) => entry.name.endsWith(ext))) {
      files.push(full);
    }
  }
  return files;
}

const allSrcFiles = getAllFiles(FRONTEND_SRC);
const componentFiles = fs.readdirSync(COMPONENTS_DIR).filter((f) => f.endsWith(".tsx") && !f.endsWith(".test.tsx"));

let orphanedCount = 0;

for (const compFile of componentFiles) {
  const baseName = path.basename(compFile, ".tsx");
  let isReferenced = false;

  for (const srcFile of allSrcFiles) {
    if (path.basename(srcFile) === compFile) continue;
    const content = fs.readFileSync(srcFile, "utf-8");
    if (content.includes(baseName)) {
      isReferenced = true;
      break;
    }
  }

  if (!isReferenced) {
    console.warn(` [UNREFERENCED] Component ${compFile} is not imported in any page or sibling component.`);
    orphanedCount++;
  } else {
    console.log(` [ACTIVE] Component ${compFile} is referenced across application.`);
  }
}

console.log("------------------------------------------------------------------");
console.log(`Total Components Evaluated: ${componentFiles.length}`);
console.log(`Active Components: ${componentFiles.length - orphanedCount}`);
console.log(`Unreferenced Candidates: ${orphanedCount}`);
console.log("------------------------------------------------------------------");
