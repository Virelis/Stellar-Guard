"use client";

import React, { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const SAMPLE_VOLUME_DATA = [
  { time: "00:00", volume: 120000, alerts: 1 },
  { time: "04:00", volume: 95000, alerts: 0 },
  { time: "08:00", volume: 240000, alerts: 3 },
  { time: "12:00", volume: 480000, alerts: 5 },
  { time: "16:00", volume: 380000, alerts: 2 },
  { time: "20:00", volume: 520000, alerts: 4 },
  { time: "24:00", volume: 290000, alerts: 1 },
];

const SAMPLE_CATEGORY_DATA = [
  { name: "Protocol Exploit", count: 8, fill: "#ef4444" },
  { name: "Key Compromise", count: 5, fill: "#f97316" },
  { name: "Sanctions / OFAC", count: 4, fill: "#a855f7" },
  { name: "AML Velocity", count: 6, fill: "#eab308" },
  { name: "Court Order", count: 2, fill: "#3b82f6" },
];

export function AnalyticsCharts() {
  const [period, setPeriod] = useState<"24h" | "7d" | "30d">("24h");
  const [chartType, setChartType] = useState<"volume" | "incidents">("volume");

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl text-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            📈 Governance & Volume Telemetry
          </h3>
          <p className="text-xs text-slate-400">
            Real-time Soroban asset flows and security incident distributions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-950 p-1 rounded-lg border border-slate-800 flex gap-1">
            <button
              onClick={() => setChartType("volume")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                chartType === "volume"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Transfer Volume
            </button>
            <button
              onClick={() => setChartType("incidents")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                chartType === "incidents"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Incident Breakdown
            </button>
          </div>

          <div className="bg-slate-950 p-1 rounded-lg border border-slate-800 flex gap-1 text-[11px]">
            {(["24h", "7d", "30d"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-2 py-1 font-semibold rounded-md transition-all ${
                  period === p ? "bg-slate-800 text-indigo-400" : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "volume" ? (
            <AreaChart data={SAMPLE_VOLUME_DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="volumeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
              <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(v: any) => [`$${Number(v).toLocaleString()}`, "Monitored Volume"]}
              />
              <Area
                type="monotone"
                dataKey="volume"
                stroke="#818cf8"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#volumeGrad)"
              />
            </AreaChart>
          ) : (
            <BarChart data={SAMPLE_CATEGORY_DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
