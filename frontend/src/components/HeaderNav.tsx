"use client";

import React, { useState } from "react";
import { WalletConnect } from "./WalletConnect";
import { ThemeToggle } from "./ThemeToggle";
import { NetworkBadge } from "./NetworkBadge";
import { useGovernanceEvents } from "../hooks/useGovernanceEvents";

interface HeaderNavProps {
  onConnectWallet: (key: string) => void;
  onOpenEmergencyDrawer: () => void;
  onOpenAddressBook: () => void;
  onOpenProposalModal: () => void;
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
}

export function HeaderNav({
  onConnectWallet,
  onOpenEmergencyDrawer,
  onOpenAddressBook,
  onOpenProposalModal,
  activeTab = "dashboard",
  onSelectTab,
}: HeaderNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { status: sseStatus } = useGovernanceEvents();

  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 px-4 sm:px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left: Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-black text-lg">
            🛡️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-white">
                Stellar<span className="text-indigo-400">-Guard</span>
              </h1>
              <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 text-[10px] font-bold px-1.5 py-0.2 rounded">
                CAP-0077
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Multi-Sig Asset Protection & RWA Quarantine
            </p>
          </div>
        </div>

        {/* Center: Live SSE Status */}
        <div className="hidden md:flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1 rounded-full text-xs">
          <span
            className={`w-2 h-2 rounded-full ${
              sseStatus === "connected"
                ? "bg-emerald-400 animate-pulse"
                : sseStatus === "connecting"
                ? "bg-amber-400"
                : "bg-slate-600"
            }`}
          />
          <span className="text-slate-400 text-[11px]">
            {sseStatus === "connected" ? "Live Stream Active" : "Connecting SSE..."}
          </span>
        </div>

        {/* Right Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          <NetworkBadge />

          <button
            onClick={onOpenAddressBook}
            className="text-xs text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg border border-slate-700 hover:border-slate-600 bg-slate-800/60 transition-colors"
            title="Open Compliance Address Book"
          >
            📖 Address Book
          </button>

          <button
            onClick={onOpenProposalModal}
            className="text-xs text-indigo-300 hover:text-white px-3 py-1.5 rounded-lg border border-indigo-500/40 hover:border-indigo-400 bg-indigo-950/40 transition-colors font-semibold"
          >
            + New Proposal
          </button>

          <button
            onClick={onOpenEmergencyDrawer}
            className="text-xs text-white px-3 py-1.5 rounded-lg border border-rose-500/50 bg-rose-600/80 hover:bg-rose-500 transition-colors font-bold flex items-center gap-1.5 shadow-md shadow-rose-600/20 active:scale-95"
            title="Open Emergency Fast Freeze"
          >
            <span>⚡ Fast Freeze</span>
          </button>

          <WalletConnect onConnect={onConnectWallet} />
          <ThemeToggle />
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-400 hover:text-white rounded-lg border border-slate-800"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-3 pt-3 border-t border-slate-800 space-y-3 pb-2">
          <div className="flex items-center justify-between">
            <NetworkBadge />
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <span
                className={`w-2 h-2 rounded-full ${
                  sseStatus === "connected" ? "bg-emerald-400" : "bg-amber-400"
                }`}
              />
              <span>{sseStatus === "connected" ? "SSE Live" : "Offline"}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                onOpenProposalModal();
                setMobileMenuOpen(false);
              }}
              className="w-full py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold"
            >
              + New Proposal
            </button>
            <button
              onClick={() => {
                onOpenEmergencyDrawer();
                setMobileMenuOpen(false);
              }}
              className="w-full py-2 bg-rose-600 text-white rounded-lg text-xs font-semibold"
            >
              ⚡ Fast Freeze
            </button>
          </div>

          <button
            onClick={() => {
              onOpenAddressBook();
              setMobileMenuOpen(false);
            }}
            className="w-full py-2 bg-slate-800 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700"
          >
            📖 Address Book
          </button>

          <div className="pt-2 border-t border-slate-800 flex justify-end">
            <WalletConnect onConnect={onConnectWallet} />
          </div>
        </div>
      )}
    </header>
  );
}

