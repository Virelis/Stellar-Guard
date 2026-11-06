/**
 * Institutional date and timestamp formatting utilities for Stellar governance feeds.
 */

export function formatRelativeTime(timestampSecondsOrMs: number): string {
  const ms = timestampSecondsOrMs > 1e11 ? timestampSecondsOrMs : timestampSecondsOrMs * 1000;
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - ms) / 1000));

  if (elapsedSeconds < 30) return "just now";
  if (elapsedSeconds < 60) return `${elapsedSeconds}s ago`;

  const minutes = Math.floor(elapsedSeconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function formatDateTime(
  timestampSecondsOrMs: number,
  options?: Intl.DateTimeFormatOptions
): string {
  const ms = timestampSecondsOrMs > 1e11 ? timestampSecondsOrMs : timestampSecondsOrMs * 1000;
  const date = new Date(ms);

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    ...options,
  };

  return date.toLocaleString(undefined, defaultOptions);
}

export function formatDuration(seconds: number): string {
  if (seconds <= 0) return "0s";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  const parts: string[] = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (s > 0 || parts.length === 0) parts.push(`${s}s`);
  return parts.join(" ");
}
