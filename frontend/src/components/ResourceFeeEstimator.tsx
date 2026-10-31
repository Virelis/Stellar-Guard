"use client";

import React, { useState } from "react";

interface ResourceFeeEstimatorProps {
  operationType?: "freeze_entry" | "initiate_unfreeze" | "vote";
  simulatedCpu?: number;
  simulatedMem?: number;
  simulatedFeeStroops?: number;
}

export function ResourceFeeEstimator({
  operationType = "freeze_entry",
  simulatedCpu = 850000,
  simulatedMem = 32768,
  simulatedFeeStroops = 1500,
}: ResourceFeeEstimatorProps) {
  const [expanded, setExpanded] = useState(false);

  const feeXlm = (simulatedFeeStroops / 10000000).toFixed(6);
  const cpuPercent = Math.min(100, Math.round((simulatedCpu / 100000000) * 100)); // Soroban limit is ~100M instructions

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-md text-xs text-slate-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm">⛽</span>
          <div>
            <span className="font-bold text-white block">Soroban Resource Meter</span>
            <span className="text-[10px] text-slate-400 font-mono">
              Op: {operationType}
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className="font-bold text-indigo-400 font-mono block">
            {feeXlm} XLM
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            ({simulatedFeeStroops} stroops)
          </span>
        </div>
      </div>

      <div className="mt-3 space-y-1.5">
        <div className="flex justify-between text-[10px] text-slate-400">
          <span>CPU Footprint</span>
          <span className="font-mono">{simulatedCpu.toLocaleString()} instructions</span>
        </div>
        <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all"
            style={{ width: `${Math.max(4, cpuPercent)}%` }}
          />
        </div>
      </div>

      <div className="mt-2 pt-2 border-t border-slate-800 flex justify-between items-center text-[10px]">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-slate-400 hover:text-white underline"
        >
          {expanded ? "Hide Resource Details" : "View Breakdown"}
        </button>
        <span className="text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
          Within Ledger Limits
        </span>
      </div>

      {expanded && (
        <div className="mt-2.5 pt-2 border-t border-slate-800 space-y-1 font-mono text-[10px] text-slate-400">
          <div className="flex justify-between">
            <span>Memory Allocated:</span>
            <span className="text-white">{(simulatedMem / 1024).toFixed(1)} KB</span>
          </div>
          <div className="flex justify-between">
            <span>Refundable Deposit:</span>
            <span className="text-white">0.000100 XLM</span>
          </div>
          <div className="flex justify-between">
            <span>Base Network Fee:</span>
            <span className="text-white">100 stroops</span>
          </div>
        </div>
      )}
    </div>
  );
}

