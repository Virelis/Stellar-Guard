"use client";

import React, { useState } from "react";

export function HackathonDemoBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);

  if (dismissed) return null;

  const handleSeedDemo = async () => {
    setSeeding(true);
    try {
      // Simulate quick trigger
      await new Promise((res) => setTimeout(res, 600));
      setSeedSuccess(true);
      setTimeout(() => setSeedSuccess(false), 3000);
    } catch {
      // Non-fatal demo trigger
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div
      role="region"
      aria-label="Hackathon Demo Notice"
      className="bg-gradient-to-r from-blue-900/90 via-indigo-900/90 to-purple-900/90 border-b border-indigo-500/30 px-4 py-2 text-xs text-white flex flex-wrap items-center justify-between gap-2 shadow-sm"
    >
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 text-[10px] uppercase tracking-wider">
          Stellar Drips Wave
        </span>
        <span className="text-gray-200">
          <strong>Hackathon Live Evaluation Mode:</strong> Soroban contract is active on Testnet with dynamic quorum enforcement.
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleSeedDemo}
          disabled={seeding}
          className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
        >
          {seeding ? "Seeding..." : seedSuccess ? "✓ Incident Drill Ready" : "⚡ Seed Demo Scenario"}
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="text-gray-400 hover:text-white p-1 rounded transition-colors"
          title="Dismiss banner"
          aria-label="Dismiss banner"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

