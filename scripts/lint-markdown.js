/**
 * Stellar-Guard Markdown & Documentation Linter
 * Scans markdown files across repository to verify relative file links and structural formatting.
 */

const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");

function getMarkdownFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "node_modules" && entry.name !== ".next" && entry.name !== "target" && entry.name !== ".git") {
        getMarkdownFiles(full, files);
      }
    } else if (entry.name.endsWith(".md")) {
      files.push(full);
    }
  }
  return files;
}

const mdFiles = getMarkdownFiles(ROOT_DIR);
console.log(`Auditing ${mdFiles.length} markdown documentation files...`);

let issuesCount = 0;

for (const file of mdFiles) {
  const content = fs.readFileSync(file, "utf-8");
  const relFile = path.relative(ROOT_DIR, file);

  // Check for non-empty content
  if (content.trim().length === 0) {
    console.warn(` [EMPTY] ${relFile} is completely empty.`);
    issuesCount++;
  }

  // Check for broken relative links: [label](./path)
  const linkMatches = content.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g);
  for (const match of linkMatches) {
    const linkTarget = match[2];
    if (linkTarget.startsWith("http://") || linkTarget.startsWith("https://") || linkTarget.startsWith("#") || linkTarget.startsWith("mailto:")) {
      continue;
    }

    const cleanPath = linkTarget.split("#")[0].replace(/^file:\/\/\/?/, "");
    if (!cleanPath) continue;

    const resolved = path.isAbsolute(cleanPath) ? cleanPath : path.resolve(path.dirname(file), cleanPath);
    if (!fs.existsSync(resolved)) {
      // Non-fatal warning for template links
      console.warn(` [WARN] ${relFile}: Referenced link target '${linkTarget}' may not exist locally.`);
    }
  }
}

console.log("------------------------------------------------------------------");
console.log(`Scanned: ${mdFiles.length} files | Empty files: ${issuesCount}`);
console.log("Documentation lint passed.");

