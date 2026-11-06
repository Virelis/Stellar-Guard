/**
 * Input Sanitization and XSS Prevention Utility
 * Hardens user-submitted compliance metadata, incident URIs, and transaction memos.
 */

export function sanitizeHtml(input: string): string {
  if (!input) return "";
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

export function sanitizeMemoText(memo: string): string {
  if (!memo) return "";
  // Strip control characters while preserving printable ASCII and standard UTF-8
  return memo
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .trim()
    .slice(0, 500);
}

export function isValidIncidentUri(uri: string): boolean {
  if (!uri) return false;
  // Strictly permit https:// and ipfs:// protocols
  if (uri.startsWith("ipfs://")) {
    const cidPart = uri.slice(7);
    return /^[a-zA-Z0-9_\-\.\/]+$/.test(cidPart);
  }
  try {
    const parsed = new URL(uri);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}
