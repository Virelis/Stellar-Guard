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

  const isLive = sseStatus === "connected";

  return (
    <header
      className="
        sticky top-0 z-40
        bg-[#030918]/80 backdrop-blur-xl
        border-b border-indigo-500/10
        shadow-header
        px-4 sm:px-6
      "
      style={{
        boxShadow: "0 4px 32px rgba(0,0,0,0.6), 0 1px 0 rgba(99,102,241,0.08)",
      }}
    >
      {/* Subtle top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/60 to-transparent" />

      <div className="max-w-7xl mx-auto flex items-center justify-between py-3">
        {/* ── Left: Premium Brand ─────────────────────────────── */}
        <div className="flex items-center gap-3">
          {/* Logo mark — layered glow effect */}
          <div className="relative flex-shrink-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-black text-white relative z-10"
              style={{
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 60%, #06b6d4 100%)",
                boxShadow:
                  "0 0 16px rgba(99,102,241,0.5), 0 0 32px rgba(99,102,241,0.25), inset 0 1px 0 rgba(255,255,255,0.2)",
              }}
            >
              🛡️
            </div>
            {/* Glow ring behind logo */}
            <div
              className="absolute inset-0 rounded-xl opacity-40 blur-md"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-white leading-none">
                Stellar
                <span
                  style={{
                    background: "linear-gradient(135deg, #818cf8, #a78bfa)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  -Guard
                </span>
              </h1>
              <span
                className="text-[9px] font-bold px-1.5 py-0.5 rounded tracking-widest uppercase"
                style={{
                  background: "rgba(99,102,241,0.12)",
                  border: "1px solid rgba(99,102,241,0.35)",
                  color: "#818cf8",
                }}
              >
                CAP-0077
              </span>
            </div>
            <p className="text-[10px] text-slate-500 hidden sm:block mt-0.5 tracking-wide font-medium">
              Multi-Sig Asset Protection & RWA Quarantine
            </p>
          </div>
        </div>

        {/* ── Center: Live SSE Status ──────────────────────────── */}
        <div
          className="hidden md:flex items-center gap-2.5 px-3.5 py-1.5 rounded-full text-xs cursor-default"
          style={{
            background: isLive ? "rgba(34,197,94,0.06)" : "rgba(15,23,42,0.8)",
            border: isLive ? "1px solid rgba(34,197,94,0.2)" : "1px solid rgba(30,45,69,0.8)",
            boxShadow: isLive ? "0 0 12px rgba(34,197,94,0.1)" : "none",
          }}
        >
          {/* Animated dot */}
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{
              backgroundColor: isLive
                ? "#22c55e"
                : sseStatus === "connecting"
                  ? "#f59e0b"
                  : "#475569",
              boxShadow: isLive
                ? "0 0 6px rgba(34,197,94,0.9), 0 0 12px rgba(34,197,94,0.5)"
                : "none",
              animation: isLive
                ? "status-blink 2s ease-in-out infinite"
                : sseStatus === "connecting"
                  ? "pulse 1.5s ease-in-out infinite"
                  : "none",
            }}
          />
          <span
            className="font-medium text-[11px] tracking-wide"
            style={{ color: isLive ? "#4ade80" : "#64748b" }}
          >
            {isLive ? "Live Feed Active" : sseStatus === "connecting" ? "Connecting..." : "Offline"}
          </span>
          {isLive && (
            <span
              className="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-widest"
              style={{ background: "rgba(34,197,94,0.12)", color: "#4ade80" }}
            >
              SSE
            </span>
          )}
        </div>

        {/* ── Right Desktop Actions ────────────────────────────── */}
        <div className="hidden md:flex items-center gap-2.5">
          <NetworkBadge />

          {/* Address Book */}
          <button
            onClick={onOpenAddressBook}
            className="text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-lg transition-all duration-200 font-medium"
            style={{
              background: "rgba(15,23,42,0.7)",
              border: "1px solid rgba(30,45,69,0.9)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(99,102,241,0.4)";
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(99,102,241,0.08)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(30,45,69,0.9)";
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(15,23,42,0.7)";
            }}
            title="Open Compliance Address Book"
          >
            📖 Address Book
          </button>

          {/* New Proposal — indigo gradient */}
          <button
            onClick={onOpenProposalModal}
            className="text-xs text-white px-3.5 py-1.5 rounded-lg font-semibold transition-all duration-200 active:scale-95"
            style={{
              background: "linear-gradient(135deg, rgba(99,102,241,0.85), rgba(139,92,246,0.85))",
              border: "1px solid rgba(99,102,241,0.4)",
              boxShadow: "0 0 12px rgba(99,102,241,0.25)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                "0 0 20px rgba(99,102,241,0.5), 0 4px 15px rgba(99,102,241,0.3)";
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                "0 0 12px rgba(99,102,241,0.25)";
              (e.currentTarget as HTMLButtonElement).style.transform = "";
            }}
          >
            <span className="flex items-center gap-1.5">
              <span>✦</span>
              <span>New Proposal</span>
            </span>
          </button>

          {/* Fast Freeze — danger gradient */}
          <button
            onClick={onOpenEmergencyDrawer}
            className="text-xs text-white px-3.5 py-1.5 rounded-lg font-bold transition-all duration-200 active:scale-95 flex items-center gap-1.5"
            style={{
              background: "linear-gradient(135deg, #be123c, #ef4444)",
              border: "1px solid rgba(239,68,68,0.4)",
              boxShadow: "0 0 12px rgba(239,68,68,0.2)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "linear-gradient(135deg, #e11d48, #f87171)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                "0 0 20px rgba(239,68,68,0.5), 0 4px 15px rgba(239,68,68,0.3)";
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "linear-gradient(135deg, #be123c, #ef4444)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                "0 0 12px rgba(239,68,68,0.2)";
              (e.currentTarget as HTMLButtonElement).style.transform = "";
            }}
            title="Open Emergency Fast Freeze"
          >
            <span>⚡</span>
            <span>Fast Freeze</span>
          </button>

          <WalletConnect onConnect={onConnectWallet} />
          <ThemeToggle />
        </div>

        {/* ── Mobile Controls ──────────────────────────────────── */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors"
            style={{ border: "1px solid rgba(30,45,69,0.9)" }}
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />

      {/* ── Mobile Drawer ─────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div
          className="md:hidden mt-0 pt-3 pb-3 border-t space-y-3"
          style={{ borderColor: "rgba(30,45,69,0.9)" }}
        >
          <div className="flex items-center justify-between px-1">
            <NetworkBadge />
            <div className="flex items-center gap-1.5 text-[11px]">
              <span
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: isLive ? "#22c55e" : "#f59e0b",
                  boxShadow: isLive ? "0 0 6px rgba(34,197,94,0.9)" : "none",
                }}
              />
              <span className="text-slate-400">{isLive ? "SSE Live" : "Offline"}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                onOpenProposalModal();
                setMobileMenuOpen(false);
              }}
              className="w-full py-2 text-white rounded-lg text-xs font-semibold"
              style={{
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                boxShadow: "0 0 12px rgba(99,102,241,0.3)",
              }}
            >
              ✦ New Proposal
            </button>
            <button
              onClick={() => {
                onOpenEmergencyDrawer();
                setMobileMenuOpen(false);
              }}
              className="w-full py-2 text-white rounded-lg text-xs font-semibold"
              style={{
                background: "linear-gradient(135deg, #be123c, #ef4444)",
                boxShadow: "0 0 12px rgba(239,68,68,0.25)",
              }}
            >
              ⚡ Fast Freeze
            </button>
          </div>

          <button
            onClick={() => {
              onOpenAddressBook();
              setMobileMenuOpen(false);
            }}
            className="w-full py-2 text-slate-200 rounded-lg text-xs font-semibold"
            style={{
              background: "rgba(15,23,42,0.8)",
              border: "1px solid rgba(30,45,69,0.9)",
            }}
          >
            📖 Address Book
          </button>

          <div
            className="pt-2 border-t flex justify-end"
            style={{ borderColor: "rgba(30,45,69,0.9)" }}
          >
            <WalletConnect onConnect={onConnectWallet} />
          </div>
        </div>
      )}
    </header>
  );
}
