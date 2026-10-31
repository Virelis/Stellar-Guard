"use client";

import React from "react";
import { CopyButton } from "./CopyButton";
import { StellarExplorerLink } from "./StellarExplorerLink";

interface ContractParametersCardProps {
  contractId?: string;
  quorumThreshold?: number;
  totalAdmins?: number;
  timelockDelaySeconds?: number;
  circuitBreakerPaused?: boolean;
}

export function ContractParametersCard({
  contractId = "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM",
  quorumThreshold = 3,
  totalAdmins = 5,
  timelockDelaySeconds = 0,
  circuitBreakerPaused = false,
}: ContractParametersCardProps) {
  const quorumPercent = Math.round((quorumThreshold / Math.max(1, totalAdmins)) * 100);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl text-slate-200">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-base">⚙️</span>
          <h3 className="text-sm font-bold text-white">
            Soroban Governance Parameters
          </h3>
        </div>
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
            circuitBreakerPaused
              ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
          }`}
        >
          {circuitBreakerPaused ? "⚠️ Circuit Breaker Active" : "✓ Operational"}
        </span>
      </div>

      <div className="mt-4 space-y-3 text-xs">
        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] text-slate-500 uppercase">Contract Address</span>
            <CopyButton text={contractId} compact={true} />
          </div>
          <div className="font-mono text-cyan-400 text-[11px] break-all select-all flex items-center justify-between">
            <StellarExplorerLink type="contract" value={contractId} label={contractId} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase block mb-1">Quorum Threshold</span>
            <span className="font-bold text-white text-sm">
              {quorumThreshold} of {totalAdmins}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">({quorumPercent}% dynamic quorum)</span>
          </div>

          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase block mb-1">Execution Delay</span>
            <span className="font-bold text-white text-sm">
              {timelockDelaySeconds}s
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              {timelockDelaySeconds === 0 ? "Immediate on quorum" : "Timelocked queue"}
            </span>
          </div>
        </div>

        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex justify-between items-center text-[11px]">
          <span className="text-slate-400">Standard Specification:</span>
          <span className="font-mono font-semibold text-indigo-400">
            CAP-0077 / Soroban v22+
          </span>
        </div>
      </div>
    </div>
  );
}

