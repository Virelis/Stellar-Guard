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
import { SkipToContent } from "@/components/SkipToContent";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ToastProvider, useToast } from "@/context/ToastContext";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { playAlertSound } from "@/utils/soundEffects";

const API = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000";

function DashboardContent() {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [alert, setAlert] = useState<string | null>(null);
  const [activeAsset, setActiveAsset] = useState<string>("ALL");
  const [activeTab, setActiveTab] = useState<"overview" | "audit" | "analytics" | "parameters">("overview");

  // Modals
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
      success("Proposal Created", `Quarantine proposal initiated for ${p.assetCode} target ${p.target.slice(0, 6)}...`);
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
      warning("Emergency Freeze Dispatched", `Quarantine vote recorded for target ${p.target.slice(0, 6)}...`);
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

      <HeaderNav
        onConnectWallet={setPublicKey}
        onOpenEmergencyDrawer={() => setIsEmergencyDrawerOpen(true)}
        onOpenAddressBook={() => setIsAddressBookOpen(true)}
        onOpenProposalModal={() => setIsProposalModalOpen(true)}
      />

      <main id="main-content" className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        {alert && <AlertBanner message={alert} onDismiss={() => setAlert(null)} />}

        {/* Top-level Overview KPIs */}
        <OverviewMetricCards />

        {/* Navigation Tabs and Asset Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === "overview"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Command Center
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === "analytics"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Analytics & Charts
            </button>
            <button
              onClick={() => setActiveTab("audit")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === "audit"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Audit Trail
            </button>
            <button
              onClick={() => setActiveTab("parameters")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === "parameters"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Contract Specs
            </button>
          </div>

          <AssetFilterTabs activeAsset={activeAsset} onChange={setActiveAsset} />
        </div>

        {/* Tab View Routing */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

      {/* Modals & Slide-over Drawers */}
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

      <AddressBookModal
        isOpen={isAddressBookOpen}
        onClose={() => setIsAddressBookOpen(false)}
      />

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
