"use client";

import React, { useState } from "react";
import axios from "axios";
import { HeaderNav } from "@/components/HeaderNav";
import { OverviewMetricCards } from "@/components/OverviewMetricCards";
import { AssetFilterTabs } from "@/components/AssetFilterTabs";
import { LedgerExplorer } from "@/components/LedgerExplorer";
import { FreezePanel } from "@/components/FreezePanel";
import { AlertBanner } from "@/components/AlertBanner";
import { AuditLogTable } from "@/components/AuditLogTable";
import { AnalyticsCharts } from "@/components/AnalyticsCharts";
import { ContractParametersCard } from "@/components/ContractParametersCard";
import { ProposalCreationModal, IncidentCategory } from "@/components/ProposalCreationModal";
import { EmergencyFreezeDrawer } from "@/components/EmergencyFreezeDrawer";
import { AddressBookModal } from "@/components/AddressBookModal";
import { CommandPaletteModal, CommandAction } from "@/components/CommandPaletteModal";
import { OfflineBanner } from "@/components/OfflineBanner";
import { HackathonDemoBanner } from "@/components/HackathonDemoBanner";
import { SkipToContent } from "@/components/SkipToContent";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ToastProvider, useToast } from "@/context/ToastContext";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { playAlertSound } from "@/utils/soundEffects";

const API = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000";

/* ══════════════════════════════════════════════════════════════
   Hero Banner — stunning cyberpunk/space section
   ══════════════════════════════════════════════════════════════ */
function HeroBanner() {
  return (
    <div
      className="relative overflow-hidden rounded-2xl mb-6"
      style={{
        background: "linear-gradient(135deg, rgba(10,14,28,0.95) 0%, rgba(15,20,40,0.98) 100%)",
        border: "1px solid rgba(99,102,241,0.2)",
        boxShadow: "0 0 40px rgba(99,102,241,0.06), 0 8px 32px rgba(0,0,0,0.5)",
      }}
    >
      {/* Background radial nebula glows */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 80% at 10% 50%, rgba(99,102,241,0.1) 0%, transparent 55%)," +
            "radial-gradient(ellipse 40% 60% at 90% 50%, rgba(139,92,246,0.08) 0%, transparent 50%)," +
            "radial-gradient(ellipse 30% 40% at 50% 100%, rgba(6,182,212,0.06) 0%, transparent 50%)",
        }}
      />

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(rgba(99,102,241,0.1) 1px, transparent 1px)," +
            "linear-gradient(90deg, rgba(99,102,241,0.1) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse 100% 100% at 50% 50%, black 30%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 100% 100% at 50% 50%, black 30%, transparent 80%)",
        }}
      />

      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(99,102,241,0.7), rgba(139,92,246,0.7), rgba(6,182,212,0.5), transparent)",
        }}
      />

      <div className="relative z-10 px-6 sm:px-8 py-7 sm:py-9 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        {/* Left: Title & description */}
        <div className="flex-1">
          {/* Badge */}
          <div className="flex items-center gap-2 mb-3">
            <span
              className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest"
              style={{
                background: "rgba(99,102,241,0.12)",
                border: "1px solid rgba(99,102,241,0.3)",
                color: "#818cf8",
              }}
            >
              ✦ Stellar Network
            </span>
            <span
              className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest"
              style={{
                background: "rgba(6,182,212,0.1)",
                border: "1px solid rgba(6,182,212,0.25)",
                color: "#22d3ee",
              }}
            >
              CAP-0077 Compliant
            </span>
          </div>

          {/* Main title */}
          <h2
            className="text-2xl sm:text-3xl font-black tracking-tight leading-tight mb-2"
            style={{
              background: "linear-gradient(135deg, #ffffff 0%, #c7d2fe 40%, #a5f3fc 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Institutional Asset Protection
          </h2>
          <p className="text-sm sm:text-base font-medium max-w-xl" style={{ color: "#6b7fa3" }}>
            Decentralized multi-signature freeze governance for regulated RWAs and stablecoins on
            Stellar. Real-time CAP-0077 quarantine with quorum consensus.
          </p>

          {/* Stat pills */}
          <div className="flex flex-wrap gap-3 mt-4">
            {[
              { label: "Uptime", value: "99.97%", color: "rgba(34,197,94" },
              { label: "Avg Latency", value: "3.2 min", color: "rgba(6,182,212" },
              { label: "Assets Monitored", value: "12", color: "rgba(99,102,241" },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
                style={{
                  background: `${color},0.08)`,
                  border: `1px solid ${color},0.2)`,
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: `${color},0.9)`, boxShadow: `0 0 4px ${color},0.8)` }}
                />
                <span style={{ color: `${color},0.7)` }}>{label}</span>
                <span className="font-bold text-white">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Shield graphic */}
        <div className="flex-shrink-0 flex flex-col items-center gap-3">
          {/* Animated shield with glow rings */}
          <div className="relative w-24 h-24 flex items-center justify-center">
            {/* Outer glow ring */}
            <div
              className="absolute inset-0 rounded-full opacity-30"
              style={{
                background: "conic-gradient(from 0deg, #6366f1, #8b5cf6, #06b6d4, #6366f1)",
                animation: "spin 8s linear infinite",
                filter: "blur(4px)",
              }}
            />
            {/* Mid ring */}
            <div
              className="absolute inset-2 rounded-full"
              style={{
                border: "1px solid rgba(99,102,241,0.3)",
                boxShadow: "0 0 16px rgba(99,102,241,0.2)",
              }}
            />
            {/* Inner circle */}
            <div
              className="relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center text-4xl"
              style={{
                background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15))",
                border: "1px solid rgba(99,102,241,0.4)",
                boxShadow: "0 0 20px rgba(99,102,241,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
                animation: "float-up 3s ease-in-out infinite",
              }}
            >
              🛡️
            </div>
          </div>

          <div className="text-center">
            <div
              className="text-xs font-bold tracking-widest uppercase"
              style={{ color: "#818cf8" }}
            >
              System Status
            </div>
            <div className="flex items-center justify-center gap-1.5 mt-1">
              <span
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: "#22c55e",
                  boxShadow: "0 0 6px rgba(34,197,94,0.9), 0 0 12px rgba(34,197,94,0.5)",
                  animation: "status-blink 2s ease-in-out infinite",
                }}
              />
              <span className="text-sm font-bold text-emerald-400">Operational</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom accent line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.3), transparent)",
        }}
      />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Premium Tab Bar
   ══════════════════════════════════════════════════════════════ */
type Tab = "overview" | "audit" | "analytics" | "parameters";

interface TabItem {
  id: Tab;
  label: string;
  icon: string;
  shortLabel?: string;
}

const TABS: TabItem[] = [
  { id: "overview", label: "Command Center", icon: "⚡", shortLabel: "Command" },
  { id: "analytics", label: "Analytics & Charts", icon: "📈", shortLabel: "Analytics" },
  { id: "audit", label: "Audit Trail", icon: "📜", shortLabel: "Audit" },
  { id: "parameters", label: "Contract Specs", icon: "⚙️", shortLabel: "Specs" },
];

interface PremiumTabBarProps {
  activeTab: Tab;
  onSelect: (tab: Tab) => void;
}

function PremiumTabBar({ activeTab, onSelect }: PremiumTabBarProps) {
  return (
    <div
      className="inline-flex items-center p-1 rounded-xl gap-0.5"
      style={{
        background: "rgba(5,10,20,0.85)",
        border: "1px solid rgba(30,45,69,0.9)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onSelect(tab.id)}
            className="relative flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200"
            style={
              isActive
                ? {
                    background:
                      "linear-gradient(135deg, rgba(99,102,241,0.9), rgba(139,92,246,0.8))",
                    color: "#ffffff",
                    boxShadow:
                      "0 0 12px rgba(99,102,241,0.35), 0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15)",
                  }
                : {
                    color: "#6b7fa3",
                    background: "transparent",
                  }
            }
            onMouseEnter={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLButtonElement).style.color = "#c7d2fe";
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(99,102,241,0.08)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLButtonElement).style.color = "#6b7fa3";
                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              }
            }}
          >
            <span className="text-sm leading-none">{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.shortLabel ?? tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Main Dashboard
   ══════════════════════════════════════════════════════════════ */
function DashboardContent() {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [alert, setAlert] = useState<string | null>(null);
  const [activeAsset, setActiveAsset] = useState<string>("ALL");
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [isEmergencyDrawerOpen, setIsEmergencyDrawerOpen] = useState(false);
  const [isAddressBookOpen, setIsAddressBookOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [detectedHighRisk, setDetectedHighRisk] = useState<string | undefined>(undefined);

  const { success, error: toastError, warning } = useToast();

  const commandActions: CommandAction[] = [
    {
      id: "new-proposal",
      title: "New Freeze Proposal",
      shortcut: "P",
      category: "Governance",
      icon: "🛡️",
      perform: () => setIsProposalModalOpen(true),
    },
    {
      id: "fast-freeze",
      title: "Emergency Fast Quarantine",
      shortcut: "E",
      category: "Emergency",
      icon: "⚡",
      perform: () => setIsEmergencyDrawerOpen(true),
    },
    {
      id: "address-book",
      title: "Compliance Address Book",
      shortcut: "A",
      category: "Keys",
      icon: "📖",
      perform: () => setIsAddressBookOpen(true),
    },
    {
      id: "view-audit",
      title: "View Audit Trail",
      shortcut: "G",
      category: "Navigation",
      icon: "📜",
      perform: () => setActiveTab("audit"),
    },
    {
      id: "view-analytics",
      title: "View Volume Analytics",
      shortcut: "V",
      category: "Navigation",
      icon: "📈",
      perform: () => setActiveTab("analytics"),
    },
  ];

  useKeyboardShortcuts(
    {
      p: () => setIsProposalModalOpen(true),
      e: () => setIsEmergencyDrawerOpen(true),
      a: () => setIsAddressBookOpen(true),
    },
    () => setIsPaletteOpen(true)
  );

  async function handleCreateProposal(p: {
    assetCode: string;
    issuer: string;
    target: string;
    category: IncidentCategory;
    referenceTicket: string;
  }) {
    try {
      await axios.post(`${API}/api/freeze/build`, {
        assetCode: p.assetCode,
        issuer: p.issuer,
        target: p.target,
        adminKey: publicKey || "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN",
      });
      playAlertSound("success");
      success(
        "Proposal Created",
        `Quarantine proposal initiated for ${p.assetCode} target ${p.target.slice(0, 6)}...`
      );
    } catch (err: any) {
      playAlertSound("critical");
      const msg = err?.response?.data?.message || err?.message || "Failed to submit proposal";
      toastError("Proposal Failed", msg);
      throw err;
    }
  }

  async function handleFastFreeze(p: { assetCode: string; issuer: string; target: string }) {
    try {
      await axios.post(`${API}/api/freeze/build`, {
        ...p,
        adminKey: publicKey || "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN",
      });
      playAlertSound("critical");
      warning(
        "Emergency Freeze Dispatched",
        `Quarantine vote recorded for target ${p.target.slice(0, 6)}...`
      );
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to execute freeze";
      toastError("Fast Freeze Failed", msg);
      throw err;
    }
  }

  function handleSuspiciousDetected(msg: string) {
    setAlert(msg);
    playAlertSound("critical");
    const match = msg.match(/G[A-Z0-9]{55}/);
    if (match) setDetectedHighRisk(match[0]);
  }

  return (
    <>
      <SkipToContent />
      <OfflineBanner />
      <HackathonDemoBanner />

      <HeaderNav
        onConnectWallet={setPublicKey}
        onOpenEmergencyDrawer={() => setIsEmergencyDrawerOpen(true)}
        onOpenAddressBook={() => setIsAddressBookOpen(true)}
        onOpenProposalModal={() => setIsProposalModalOpen(true)}
      />

      <main id="main-content" className="px-4 sm:px-6 py-6 max-w-7xl mx-auto space-y-5">
        {/* Alert banner */}
        {alert && <AlertBanner message={alert} onDismiss={() => setAlert(null)} />}

        {/* ── HERO BANNER ─────────────────────────────────────── */}
        <HeroBanner />

        {/* ── METRIC CARDS ────────────────────────────────────── */}
        <OverviewMetricCards />

        {/* ── TAB BAR + ASSET FILTERS ──────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <PremiumTabBar activeTab={activeTab} onSelect={setActiveTab} />
          <AssetFilterTabs activeAsset={activeAsset} onChange={setActiveAsset} />
        </div>

        {/* ── Divider with glow ─────────────────────────────── */}
        <div
          className="h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(99,102,241,0.3), rgba(139,92,246,0.2), transparent)",
          }}
        />

        {/* ── TAB CONTENT ──────────────────────────────────────── */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2">
              <ErrorBoundary fallbackTitle="Ledger Stream Unavailable">
                <LedgerExplorer onSuspicious={handleSuspiciousDetected} />
              </ErrorBoundary>
            </div>
            <div>
              <ErrorBoundary fallbackTitle="Freeze Panel Unavailable">
                <FreezePanel adminKey={publicKey} onError={(msg) => setAlert(msg)} />
              </ErrorBoundary>
            </div>
          </div>
        )}

        {activeTab === "analytics" && (
          <ErrorBoundary fallbackTitle="Analytics Telemetry Failed">
            <AnalyticsCharts />
          </ErrorBoundary>
        )}

        {activeTab === "audit" && (
          <ErrorBoundary fallbackTitle="Audit Trail Failed">
            <AuditLogTable />
          </ErrorBoundary>
        )}

        {activeTab === "parameters" && (
          <div className="max-w-2xl mx-auto">
            <ErrorBoundary fallbackTitle="Contract Parameters Unavailable">
              <ContractParametersCard />
            </ErrorBoundary>
          </div>
        )}
      </main>

      {/* ── Modals & Drawers ──────────────────────────────────── */}
      <ProposalCreationModal
        isOpen={isProposalModalOpen}
        onClose={() => setIsProposalModalOpen(false)}
        onSubmit={handleCreateProposal}
        adminPublicKey={publicKey}
      />

      <EmergencyFreezeDrawer
        isOpen={isEmergencyDrawerOpen}
        onClose={() => setIsEmergencyDrawerOpen(false)}
        onExecuteFreeze={handleFastFreeze}
        detectedHighRiskAddress={detectedHighRisk}
      />

      <AddressBookModal isOpen={isAddressBookOpen} onClose={() => setIsAddressBookOpen(false)} />

      <CommandPaletteModal
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        actions={commandActions}
      />
    </>
  );
}

export default function CommandCenter() {
  return (
    <ToastProvider>
      <DashboardContent />
    </ToastProvider>
  );
}
