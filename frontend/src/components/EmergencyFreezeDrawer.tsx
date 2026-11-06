"use client";

import React, { useState } from "react";
import { SimulationPreviewCard } from "./SimulationPreviewCard";

interface EmergencyFreezeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteFreeze: (proposal: {
    assetCode: string;
    issuer: string;
    target: string;
  }) => Promise<void>;
  detectedHighRiskAddress?: string;
}

export function EmergencyFreezeDrawer({
  isOpen,
  onClose,
  onExecuteFreeze,
  detectedHighRiskAddress,
}: EmergencyFreezeDrawerProps) {
  const [assetCode, setAssetCode] = useState("USDC");
  const [issuer, setIssuer] = useState("");
  const [target, setTarget] = useState(detectedHighRiskAddress || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleFreeze(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!target.startsWith("G") || target.length !== 56) {
      setError("Target must be a valid 56-character Stellar public key starting with 'G'");
      return;
    }

    if (!issuer.startsWith("G") || issuer.length !== 56) {
      setError("Issuer must be a valid 56-character Stellar public key starting with 'G'");
      return;
    }

    setLoading(true);
    try {
      await onExecuteFreeze({ assetCode, issuer, target });
      onClose();
    } catch (err: any) {
      setError(err?.message || "Emergency quarantine initiation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-md w-full bg-slate-900 border-l border-red-500/30 p-6 shadow-2xl flex flex-col text-slate-100 animate-in slide-in-from-right duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
            <h2 className="text-base font-bold text-white tracking-wide uppercase">
              Emergency Fast Quarantine
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white rounded-lg p-1">
            ✕
          </button>
        </div>

        <p className="text-xs text-rose-400/90 bg-rose-500/10 border border-rose-500/20 rounded-lg p-2.5 my-4">
          🚨 High-priority incident mode: Use this fast-path to immediately initiate quorum freeze
          on compromised Stellar addresses.
        </p>

        <form onSubmit={handleFreeze} className="flex-1 space-y-4 overflow-y-auto pr-1 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Asset Code</label>
            <div className="flex gap-2">
              {["USDC", "EURC"].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setAssetCode(c)}
                  className={`flex-1 py-1.5 rounded-lg font-bold border transition-all ${
                    assetCode === c
                      ? "bg-rose-600 border-rose-400 text-white"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Asset Issuer (G...)</label>
            <input
              type="text"
              placeholder="G..."
              value={issuer}
              onChange={(e) => setIssuer(e.target.value.trim())}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-rose-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-slate-300 font-semibold">Target Account to Freeze</label>
              {detectedHighRiskAddress && (
                <button
                  type="button"
                  onClick={() => setTarget(detectedHighRiskAddress)}
                  className="text-[10px] text-amber-400 underline"
                >
                  Fill Detected Target
                </button>
              )}
            </div>
            <input
              type="text"
              placeholder="G... (compromised address)"
              value={target}
              onChange={(e) => setTarget(e.target.value.trim())}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-rose-500 focus:outline-none"
              required
            />
          </div>

          {/* Pre-flight Simulation */}
          <SimulationPreviewCard assetCode={assetCode} issuer={issuer} target={target} />

          {error && (
            <div className="text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-lg p-2.5 text-xs">
              {error}
            </div>
          )}

          <div className="pt-4 border-t border-slate-800">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg font-bold text-xs bg-rose-600 hover:bg-rose-500 active:scale-[0.98] text-white transition-all shadow-lg shadow-rose-600/30 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? "Transacting..." : "⚡ Fast Execute Quorum Freeze"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
