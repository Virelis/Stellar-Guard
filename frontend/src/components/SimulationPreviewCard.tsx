"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000";

interface SimulationPreviewCardProps {
  assetCode: string;
  issuer: string;
  target: string;
  onSimulationComplete?: (result: SimulationResult) => void;
}

export interface SimulationResult {
  valid: boolean;
  assetCode: string;
  issuer: string;
  target: string;
  isAlreadyFrozen: boolean;
  currentVotes: number;
  postVoteCount: number;
  quorumThreshold: number;
  willExecuteAtQuorum: boolean;
  estimatedFeeStroops: string;
  estimatedFeeXlm: string;
  error?: string;
  message?: string;
}

export function SimulationPreviewCard({
  assetCode,
  issuer,
  target,
  onSimulationComplete,
}: SimulationPreviewCardProps) {
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!assetCode || !issuer || !target || target.length !== 56) {
      setSimulation(null);
      return;
    }

    let isMounted = true;
    async function runSim() {
      setLoading(true);
      setError(null);
      try {
        const { data } = await axios.post<SimulationResult>(`${API}/api/freeze/simulate`, {
          assetCode,
          issuer,
          target,
        });
        if (isMounted) {
          setSimulation(data);
          if (onSimulationComplete) onSimulationComplete(data);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.response?.data?.message || err?.message || "Simulation error");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    const timer = setTimeout(runSim, 400); // debounce input
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [assetCode, issuer, target]);

  if (!assetCode || !target) return null;

  return (
    <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-4 shadow-lg text-slate-200">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-base">🧪</span>
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Pre-flight Soroban Simulation
          </h3>
        </div>
        {loading ? (
          <span className="text-[10px] text-indigo-400 animate-pulse font-mono">
            Simulating on Soroban...
          </span>
        ) : simulation?.valid ? (
          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-semibold">
            Simulation Passed
          </span>
        ) : error ? (
          <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded font-semibold">
            Simulation Rejected
          </span>
        ) : null}
      </div>

      {error && (
        <div className="mt-3 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-lg p-2.5">
          {error}
        </div>
      )}

      {simulation && (
        <div className="mt-3 space-y-2.5 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-0.5">Quarantine State</span>
              <span
                className={`font-semibold ${simulation.isAlreadyFrozen ? "text-amber-400" : "text-emerald-400"}`}
              >
                {simulation.isAlreadyFrozen ? "Already Quarantined" : "Active / Unfrozen"}
              </span>
            </div>

            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-0.5">Execution Impact</span>
              <span
                className={`font-semibold ${simulation.willExecuteAtQuorum ? "text-rose-400" : "text-indigo-400"}`}
              >
                {simulation.willExecuteAtQuorum
                  ? "Immediate Freeze at Quorum"
                  : "Signature Recorded (Pending)"}
              </span>
            </div>
          </div>

          <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between text-slate-400 font-mono text-[11px]">
            <span>Est. Transaction Fee:</span>
            <span className="text-white font-semibold">
              {simulation.estimatedFeeStroops} stroops ({simulation.estimatedFeeXlm} XLM)
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
