"use client";

import React from "react";

export interface AssetFilterTabsProps {
  activeAsset: string;
  onChange: (asset: string) => void;
  counts?: Record<string, number>;
}

export function AssetFilterTabs({
  activeAsset,
  onChange,
  counts = { ALL: 15, USDC: 11, EURC: 4 },
}: AssetFilterTabsProps) {
  const tabs = [
    { id: "ALL", label: "All Assets", icon: "🌐" },
    { id: "USDC", label: "USDC (USD Coin)", icon: "💵" },
    { id: "EURC", label: "EURC (Euro Coin)", icon: "💶" },
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
      {tabs.map((t) => {
        const count = counts[t.id] ?? 0;
        const isActive = activeAsset === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 font-semibold whitespace-nowrap transition-all ${
              isActive
                ? "bg-indigo-600 border-indigo-400 text-white shadow-md shadow-indigo-600/20"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
            }`}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                isActive
                  ? "bg-white/20 text-white"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

