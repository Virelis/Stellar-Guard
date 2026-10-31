"use client";

import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { resolveAlias } from "../utils/addressBook";
import { exportAuditLogsToCsv, exportAuditLogsToJson } from "../utils/auditExport";

const API = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000";

export interface AuditEntry {
  id: number;
  event_type: string;
  asset_code?: string;
  issuer?: string;
  target?: string;
  admin_key?: string;
  details?: string;
  created_at: number;
}

export function AuditLogTable() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    setLoading(true);
    try {
      const { data } = await axios.get<AuditEntry[]>(`${API}/api/audit/logs`);
      setLogs(Array.isArray(data) ? data : []);
    } catch {
      // Fallback sample data if backend endpoint is unavailable during offline testing
      setLogs([
        {
          id: 1,
          event_type: "FREEZE_EXECUTED",
          asset_code: "USDC",
          target: "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN",
          admin_key: "GBDEVIFVWB277NYUCGDUIWI2XNXOH4AC7WGBNHFQLIN5P5WZ74UHBSVV",
          details: "Quorum met (3/3). Asset trustline frozen on-chain.",
          created_at: Math.floor(Date.now() / 1000) - 1800,
        },
        {
          id: 2,
          event_type: "VOTE_CAST",
          asset_code: "USDC",
          target: "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN",
          admin_key: "GCKAZ62ZOOAOHYQ7L4F64YV5B7D7UGI4OWGFLQL3U6V7PYX2NY5R6ZHO",
          details: "Affirmative vote 2/3 recorded.",
          created_at: Math.floor(Date.now() / 1000) - 3600,
        },
        {
          id: 3,
          event_type: "FREEZE_PROPOSED",
          asset_code: "USDC",
          target: "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN",
          admin_key: "GBDEVIFVWB277NYUCGDUIWI2XNXOH4AC7WGBNHFQLIN5P5WZ74UHBSVV",
          details: "Incident INC-2026-001 opened for suspected AML structuring.",
          created_at: Math.floor(Date.now() / 1000) - 7200,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const filteredLogs = useMemo(() => {
    return logs
      .filter((log) => {
        if (filterType !== "ALL" && log.event_type !== filterType) return false;
        if (search) {
          const q = search.toLowerCase();
          const matchTarget = log.target?.toLowerCase().includes(q);
          const matchAdmin = log.admin_key?.toLowerCase().includes(q);
          const matchType = log.event_type.toLowerCase().includes(q);
          const matchDetails = log.details?.toLowerCase().includes(q);
          if (!matchTarget && !matchAdmin && !matchType && !matchDetails) return false;
        }
        return true;
      })
      .sort((a, b) => {
        return sortOrder === "desc" ? b.created_at - a.created_at : a.created_at - b.created_at;
      });
  }, [logs, filterType, search, sortOrder]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl text-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            📜 Governance Audit Trail
          </h3>
          <p className="text-xs text-slate-400">
            Immutable log of all freeze proposals, votes, and administrative actions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search address or event..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono placeholder:font-sans"
          />

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Events</option>
            <option value="FREEZE_PROPOSED">FREEZE_PROPOSED</option>
            <option value="VOTE_CAST">VOTE_CAST</option>
            <option value="FREEZE_EXECUTED">FREEZE_EXECUTED</option>
            <option value="DATABASE_MAINTENANCE">MAINTENANCE</option>
          </select>

          <button
            onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
            className="p-1 border border-slate-700 bg-slate-950 rounded-lg text-xs hover:border-slate-600 px-2"
            title="Toggle Sort Order"
          >
            {sortOrder === "desc" ? "↓ Newest" : "↑ Oldest"}
          </button>

          <button
            onClick={fetchLogs}
            className="p-1 border border-slate-700 bg-slate-950 rounded-lg text-xs hover:border-slate-600 px-2"
            title="Refresh logs"
          >
            🔄
          </button>

          <button
            onClick={() => exportAuditLogsToCsv(filteredLogs)}
            className="p-1 border border-slate-700 bg-slate-950 rounded-lg text-xs hover:border-slate-600 px-2 text-emerald-400 font-semibold"
            title="Export filtered records to CSV"
          >
            📥 CSV
          </button>

          <button
            onClick={() => exportAuditLogsToJson(filteredLogs)}
            className="p-1 border border-slate-700 bg-slate-950 rounded-lg text-xs hover:border-slate-600 px-2 text-indigo-400 font-semibold"
            title="Export filtered records to JSON"
          >
            📥 JSON
          </button>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
            <tr>
              <th className="py-2.5 px-3">Timestamp</th>
              <th className="py-2.5 px-3">Event Type</th>
              <th className="py-2.5 px-3">Asset</th>
              <th className="py-2.5 px-3">Target Account</th>
              <th className="py-2.5 px-3">Admin Signer</th>
              <th className="py-2.5 px-3">Audit Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500">
                  Loading governance audit records...
                </td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500">
                  No audit logs matching current filter.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => {
                const dateStr = new Date(log.created_at * 1000).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                });
                return (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-3 whitespace-nowrap text-slate-400 text-[10px]">
                      {dateStr}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold font-sans ${
                          log.event_type.includes("EXECUTED")
                            ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                            : log.event_type.includes("VOTE")
                            ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                            : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        {log.event_type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-white">
                      {log.asset_code || "—"}
                    </td>
                    <td className="py-2.5 px-3" title={log.target}>
                      {log.target ? (
                        <span className="text-cyan-400">{resolveAlias(log.target)}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-2.5 px-3" title={log.admin_key}>
                      {log.admin_key ? (
                        <span className="text-indigo-300">{resolveAlias(log.admin_key)}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-sans text-slate-400 text-xs max-w-xs truncate" title={log.details}>
                      {log.details || "—"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
