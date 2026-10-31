"use client";

import React, { useState } from "react";

interface Sep1DomainBadgeProps {
  domain?: string;
  verified?: boolean;
}

export function Sep1DomainBadge({ domain = "stellar-guard.org", verified = true }: Sep1DomainBadgeProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block text-xs">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold hover:border-emerald-500/50 transition-colors shadow-sm"
        title="SEP-0001 Domain Verification Status"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span>SEP-0001 Verified</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 mt-2 w-72 p-4 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 text-slate-200 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-bold text-white flex items-center gap-1.5">
                🌐 SEP-0001 Identity Manifest
              </span>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white text-xs">
                ✕
              </button>
            </div>

            <div className="mt-3 space-y-2 text-[11px]">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Verified Domain</span>
                <span className="font-mono text-emerald-400 font-bold">{domain}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Standard</span>
                <span className="text-slate-300">Stellar SEP-0001 Discovery Manifest</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase">RWA Compliance</span>
                <span className="text-slate-300">SEP-0008 Regulated Assets Supported</span>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <a
                  href="/.well-known/stellar.toml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 underline font-semibold flex items-center justify-between"
                >
                  <span>View Raw stellar.toml</span>
                  <span>↗</span>
                </a>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

