"use client";

import React, { useState } from "react";

interface ProposalData {
  assetCode: string;
  issuer: string;
  target: string;
  voters?: string[];
  createdAt?: number;
}

interface ExportProposalsButtonProps {
  proposals: ProposalData[];
  network?: string;
}

export function ExportProposalsButton({
  proposals,
  network = "testnet",
}: ExportProposalsButtonProps) {
  const [exported, setExported] = useState(false);

  function handleExport() {
    const bundle = {
      manifestVersion: "1.0",
      network,
      exportedAt: new Date().toISOString(),
      proposalCount: proposals.length,
      proposals,
    };

    const jsonStr = JSON.stringify(bundle, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stellar_guard_proposals_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setExported(true);
    setTimeout(() => setExported(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold border border-slate-700 transition-colors shadow-sm"
      title="Export active proposals snapshot as JSON"
    >
      <span>📦</span>
      <span>{exported ? "Bundle Downloaded!" : `Export Bundle (${proposals.length})`}</span>
    </button>
  );
}
