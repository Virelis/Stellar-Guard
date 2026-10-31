"use client";

import React from "react";
import { SimulationResult } from "./SimulationPreviewCard";
import { StellarExplorerLink } from "./StellarExplorerLink";
import { CopyButton } from "./CopyButton";

interface SimulationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  simulation: SimulationResult | null;
}

export function SimulationDetailsModal({
  isOpen,
  onClose,
  simulation,
}: SimulationDetailsModalProps) {
  if (!isOpen || !simulation) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-6 shadow-2xl relative text-slate-100 flex flex-col text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-base">🔬</span>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Soroban Simulation Telemetry
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            ✕
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
            <div>
              <span className="text-[10px] text-slate-500 uppercase block mb-0.5">Target Account</span>
              <div className="flex items-center justify-between">
                <span className="font-mono text-cyan-400 text-[11px] break-all select-all">
                  {simulation.target}
                </span>
                <CopyButton text={simulation.target} compact={true} />
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 uppercase block mb-0.5">Asset Code</span>
              <span className="font-bold text-white">{simulation.assetCode}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block mb-0.5">Pre-Vote Signatures</span>
              <span className="font-bold text-white text-sm font-mono">{simulation.currentVotes}</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block mb-0.5">Post-Vote Projection</span>
              <span className="font-bold text-indigo-400 text-sm font-mono">
                {simulation.postVoteCount} / {simulation.quorumThreshold}
              </span>
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1.5 font-mono text-[11px]">
            <div className="flex justify-between text-slate-400">
              <span>Estimated Stroop Fee:</span>
              <span className="text-white font-bold">{simulation.estimatedFeeStroops} stroops</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Equivalent XLM Cost:</span>
              <span className="text-white font-bold">{simulation.estimatedFeeXlm} XLM</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Quorum Attainment:</span>
              <span className={simulation.willExecuteAtQuorum ? "text-rose-400 font-bold" : "text-amber-400"}>
                {simulation.willExecuteAtQuorum ? "Quorum Attained (Execute)" : "Pending Signatures"}
              </span>
            </div>
          </div>

          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">View Account on Explorer:</span>
            <StellarExplorerLink type="account" value={simulation.target} />
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
