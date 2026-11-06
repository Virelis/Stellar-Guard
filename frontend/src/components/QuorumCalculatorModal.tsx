"use client";

import React, { useState } from "react";

interface QuorumCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuorumCalculatorModal({ isOpen, onClose }: QuorumCalculatorModalProps) {
  const [adminCount, setAdminCount] = useState(5);
  const [percentage, setPercentage] = useState(60);

  if (!isOpen) return null;

  const requiredVotes = Math.ceil((adminCount * percentage) / 100);
  const faultTolerance = adminCount - requiredVotes;
  const isSupermajority = percentage >= 66;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-6 shadow-2xl relative text-slate-100 flex flex-col text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-base">🧮</span>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Dynamic Quorum Calculator
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            ✕
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <div className="flex justify-between text-[11px] mb-1 font-semibold">
              <span className="text-slate-300">Total Active Admins (N)</span>
              <span className="font-mono text-indigo-400">{adminCount} Admins</span>
            </div>
            <input
              type="range"
              min={3}
              max={15}
              value={adminCount}
              onChange={(e) => setAdminCount(Number(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] mb-1 font-semibold">
              <span className="text-slate-300">Quorum Target Percentage</span>
              <span className="font-mono text-indigo-400">{percentage}%</span>
            </div>
            <input
              type="range"
              min={51}
              max={100}
              value={percentage}
              onChange={(e) => setPercentage(Number(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-xs font-semibold">Required Signatures:</span>
              <span className="text-xl font-black text-emerald-400 font-mono">
                {requiredVotes} of {adminCount}
              </span>
            </div>

            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-400">Offline Fault Tolerance:</span>
              <span className="font-mono text-white font-bold">
                {faultTolerance} {faultTolerance === 1 ? "admin" : "admins"}
              </span>
            </div>

            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-400">Consensus Mode:</span>
              <span
                className={`font-semibold ${isSupermajority ? "text-purple-400" : "text-cyan-400"}`}
              >
                {isSupermajority ? "Supermajority Quorum" : "Simple Majority"}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
