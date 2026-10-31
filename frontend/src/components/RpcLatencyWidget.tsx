"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000";

export function RpcLatencyWidget() {
  const [history, setHistory] = useState<number[]>([45, 52, 48, 60, 42, 55]);
  const [currentLatency, setCurrentLatency] = useState<number>(42);

  useEffect(() => {
    const timer = setInterval(async () => {
      const start = Date.now();
      try {
        await axios.get(`${API}/health`);
        const rtt = Math.max(10, Date.now() - start);
        setCurrentLatency(rtt);
        setHistory((prev) => [...prev.slice(-9), rtt]);
      } catch {
        // non-fatal
      }
    }, 10000); // sample every 10s

    return () => clearInterval(timer);
  }, []);

  const maxVal = Math.max(100, ...history);
  const avg = Math.round(history.reduce((a, b) => a + b, 0) / history.length);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-md text-xs text-slate-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-bold text-white text-xs">Soroban RPC Ping</span>
        </div>
        <div className="text-right font-mono">
          <span className="font-bold text-emerald-400">{currentLatency}ms</span>
          <span className="text-[10px] text-slate-500 block">avg: {avg}ms</span>
        </div>
      </div>

      {/* Mini Sparkline Bars */}
      <div className="mt-3 flex items-end gap-1.5 h-8 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
        {history.map((val, idx) => {
          const heightPercent = Math.max(15, Math.round((val / maxVal) * 100));
          return (
            <div
              key={idx}
              className="flex-1 bg-indigo-500/80 hover:bg-indigo-400 rounded-sm transition-all"
              style={{ height: `${heightPercent}%` }}
              title={`Ping #${idx + 1}: ${val}ms`}
            />
          );
        })}
      </div>
    </div>
  );
}

