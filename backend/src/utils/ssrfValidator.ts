import net from "net";

/**
 * Validates webhook URLs to protect against Server-Side Request Forgery (SSRF).
 * Blocks loopback, cloud metadata (169.254.169.254), link-local, and private network ranges.
 */
export function isSafeWebhookUrl(rawUrl: string): { valid: boolean; reason?: string } {
  if (!rawUrl || typeof rawUrl !== "string") {
    return { valid: false, reason: "Missing or invalid URL string" };
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { valid: false, reason: "Invalid URL syntax" };
  }

  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction && parsed.protocol !== "https:") {
    return { valid: false, reason: "Webhook URL must use HTTPS in production" };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { valid: false, reason: "Webhook URL must use HTTP or HTTPS protocol" };
  }

  const hostname = parsed.hostname.toLowerCase().trim();

  // Reject local and cloud metadata hostnames
  const blockedHostnames = [
    "localhost",
    "metadata.google.internal",
    "instance-data",
    "169.254.169.254",
    "fd00:ec2::254",
  ];
  if (blockedHostnames.includes(hostname)) {
    return { valid: false, reason: "Blocked internal or cloud metadata destination" };
  }

  // If the hostname is an IP address, check against dangerous IP ranges
  if (net.isIP(hostname)) {
    if (net.isIPv4(hostname)) {
      const parts = hostname.split(".").map(Number);
      const [b0, b1] = parts;

      // Loopback (127.0.0.0/8) or 0.0.0.0
      if (b0 === 127 || b0 === 0) {
        return { valid: false, reason: "Loopback IP addresses are not permitted" };
      }

      // Cloud metadata and link-local (169.254.0.0/16)
      if (b0 === 169 && b1 === 254) {
        return { valid: false, reason: "Link-local and metadata addresses are not permitted" };
      }

      // Private networks (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16) in production
      if (isProduction) {
        if (b0 === 10 || (b0 === 172 && b1 >= 16 && b1 <= 31) || (b0 === 192 && b1 === 168)) {
          return { valid: false, reason: "Private IP subnets are not permitted in production" };
        }
      }
    } else if (net.isIPv6(hostname)) {
      // IPv6 loopback (::1) or unique local address (fc00::/7)
      if (
        hostname === "::1" ||
        hostname.startsWith("fc") ||
        hostname.startsWith("fd") ||
        hostname.startsWith("fe80")
      ) {
        return { valid: false, reason: "Private or loopback IPv6 addresses are not permitted" };
      }
    }
  }

  return { valid: true };
}
