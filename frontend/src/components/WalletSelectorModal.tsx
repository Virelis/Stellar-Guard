"use client";

import React from "react";

export type WalletType = "freighter" | "albedo" | "xbull" | "read_only";

interface WalletOption {
  id: WalletType;
  name: string;
  description: string;
  icon: string;
  badge: string;
  isPopular?: boolean;
}

const WALLET_OPTIONS: WalletOption[] = [
  {
    id: "freighter",
    name: "Freighter Wallet",
    description: "Official SDF browser extension for Soroban and Stellar",
    icon: "🚀",
    badge: "Recommended",
    isPopular: true,
  },
  {
    id: "albedo",
    name: "Albedo Signer",
    description: "Web-based non-custodial popup signer (no extension needed)",
    icon: "🌐",
    badge: "Web Ready",
  },
  {
    id: "xbull",
    name: "xBull Wallet",
    description: "Multi-platform wallet supporting hardware keys and vaults",
    icon: "🐂",
    badge: "Hardware",
  },
  {
    id: "read_only",
    name: "Auditor Mode (Read-Only)",
    description: "Enter any Stellar key for observation without signing",
    icon: "👁️",
    badge: "Auditor",
  },
];

interface WalletSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectWallet: (wallet: WalletType) => void;
}

export function WalletSelectorModal({
  isOpen,
  onClose,
  onSelectWallet,
}: WalletSelectorModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-6 shadow-2xl relative text-slate-100">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              👛 Connect Stellar Wallet
            </h3>
            <p className="text-xs text-slate-400">
              Select your preferred Stellar signature provider
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg text-xs">
            ✕
          </button>
        </div>

        <div className="mt-4 space-y-2.5">
          {WALLET_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => {
                onSelectWallet(opt.id);
                onClose();
              }}
              className="w-full bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/50 rounded-xl p-3.5 flex items-center justify-between text-left transition-all group"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl p-2 rounded-lg bg-slate-900 border border-slate-800 group-hover:scale-110 transition-transform">
                  {opt.icon}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs">{opt.name}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                      opt.isPopular
                        ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                        : "bg-slate-800 text-slate-400 border border-slate-700"
                    }`}>
                      {opt.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{opt.description}</p>
                </div>
              </div>
              <span className="text-slate-600 group-hover:text-indigo-400 text-sm transition-colors">
                →
              </span>
            </button>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-500">
            Compliant with Stellar WebAuth (SEP-0010) & Soroban authorization
          </p>
        </div>
      </div>
    </div>
  );
}
