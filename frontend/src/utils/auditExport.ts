import { AuditEntry } from "../components/AuditLogTable";

export function exportAuditLogsToCsv(logs: AuditEntry[], filename?: string): void {
  if (typeof window === "undefined" || !logs.length) return;

  const headers = ["ID", "Timestamp (ISO)", "Event Type", "Asset Code", "Issuer", "Target Account", "Admin Signer", "Details"];
  const rows = logs.map((log) => [
    log.id,
    new Date(log.created_at * 1000).toISOString(),
    `"${(log.event_type || "").replace(/"/g, '""')}"`,
    `"${(log.asset_code || "").replace(/"/g, '""')}"`,
    `"${(log.issuer || "").replace(/"/g, '""')}"`,
    `"${(log.target || "").replace(/"/g, '""')}"`,
    `"${(log.admin_key || "").replace(/"/g, '""')}"`,
    `"${(log.details || "").replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, filename || `stellar_guard_audit_${formatDateNow()}.csv`);
}

export function exportAuditLogsToJson(logs: AuditEntry[], filename?: string): void {
  if (typeof window === "undefined" || !logs.length) return;

  const jsonStr = JSON.stringify(logs, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8;" });
  triggerDownload(blob, filename || `stellar_guard_audit_${formatDateNow()}.json`);
}

function formatDateNow(): string {
  return new Date().toISOString().slice(0, 10);
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
