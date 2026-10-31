"use client";

import React from "react";

interface QuorumMeterProps {
  currentVotes: number;
  requiredQuorum: number;
  totalAdmins?: number;
  voterKeys?: string[];
  variant?: "linear" | "circular" | "compact";
  size?: number; // for circular variant
}

export function QuorumMeter({
  currentVotes,
  requiredQuorum,
  totalAdmins = 5,
  voterKeys = [],
  variant = "linear",
  size = 64,
}: QuorumMeterProps) {
  const percentage = Math.min(100, Math.round((currentVotes / Math.max(1, requiredQuorum)) * 100));
  const isQuorumReached = currentVotes >= requiredQuorum;

  if (variant === "compact") {
    return (
      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-800 border border-slate-700">
        <span
          className={`w-2 h-2 rounded-full ${
            isQuorumReached ? "bg-emerald-400 animate-ping" : "bg-indigo-400"
          }`}
        />
        <span className="text-slate-200">
          {currentVotes}/{requiredQuorum}
        </span>
        <span className="text-[10px] text-slate-400">({percentage}%)</span>
      </div>
    );
  }

  if (variant === "circular") {
    const strokeWidth = 5;
    const radius = (size - strokeWidth * 2) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-800"
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={`transition-all duration-500 ease-out ${
              isQuorumReached ? "text-emerald-500" : "text-indigo-500"
            }`}
            fill="transparent"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xs font-bold text-white leading-none">
            {currentVotes}/{requiredQuorum}
          </span>
          <span className="text-[9px] text-slate-400">{percentage}%</span>
        </div>
      </div>
    );
  }

  // Linear variant
  return (
    <div className="w-full space-y-1.5">
      <div className="flex items-center justify-between text-xs font-medium">
        <span className="text-slate-400 flex items-center gap-1.5">
          <span>Quorum Progress</span>
          {isQuorumReached ? (
            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded font-semibold border border-emerald-500/30">
              Quorum Met
            </span>
          ) : (
            <span className="text-[10px] text-indigo-400 font-mono">
              {requiredQuorum - currentVotes} more needed
            </span>
          )}
        </span>
        <span className="text-slate-200 font-mono">
          {currentVotes} / {requiredQuorum} ({percentage}%)
        </span>
      </div>

      <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50 p-0.5">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            isQuorumReached
              ? "bg-gradient-to-r from-emerald-500 to-teal-400"
              : "bg-gradient-to-r from-indigo-500 to-purple-500"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {voterKeys.length > 0 && (
        <div className="flex items-center gap-1 pt-1 overflow-x-auto text-[10px] text-slate-400">
          <span className="text-slate-500">Signers:</span>
          {voterKeys.map((vk, i) => (
            <span
              key={i}
              className="bg-slate-800 text-indigo-300 font-mono px-1.5 py-0.5 rounded border border-slate-700"
              title={vk}
            >
              {vk.slice(0, 4)}…{vk.slice(-3)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
