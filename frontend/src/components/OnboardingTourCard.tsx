"use client";

import React, { useState, useEffect } from "react";

const STORAGE_KEY = "stellar_guard_onboarding_dismissed";

const STEPS = [
  {
    step: 1,
    title: "1. Connect Institutional Wallet",
    description:
      "Connect your Freighter or Albedo wallet as an authorized multi-sig signer for the CAP-0077 contract.",
    icon: "🚀",
  },
  {
    step: 2,
    title: "2. Monitor Live Horizon Stream",
    description:
      "Inspect continuous USDC & EURC asset flows. Real-time AML risk heuristics flag unusual transfer velocity and whale spikes.",
    icon: "📡",
  },
  {
    step: 3,
    title: "3. Propose Quorum Quarantine",
    description:
      "Initiate multi-sig freeze motions against compromised accounts, attaching incident reference tickets and categorization codes.",
    icon: "🛡️",
  },
  {
    step: 4,
    title: "4. Reach Multi-Sig Consensus",
    description:
      "Once 3-of-5 admin signatures are recorded on Soroban, the protocol-level freeze executes atomically on-chain.",
    icon: "⚖️",
  },
];

export function OnboardingTourCard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const isDismissed = localStorage.getItem(STORAGE_KEY);
    if (!isDismissed) setDismissed(false);
  }, []);

  function handleDismiss() {
    setDismissed(true);
    localStorage.setItem(STORAGE_KEY, "true");
  }

  if (dismissed) return null;

  const active = STEPS[currentStep];

  return (
    <div className="bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-2xl p-5 shadow-xl text-slate-200 text-xs relative animate-in fade-in duration-200">
      <button
        onClick={handleDismiss}
        className="absolute top-4 right-4 text-slate-500 hover:text-white p-1"
        aria-label="Dismiss tour"
      >
        ✕
      </button>

      <div className="flex items-start gap-4">
        <span className="text-3xl p-3 bg-indigo-600/20 border border-indigo-500/30 rounded-xl">
          {active.icon}
        </span>

        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
              Operator Walkthrough ({currentStep + 1} of {STEPS.length})
            </span>
          </div>
          <h4 className="text-sm font-bold text-white">{active.title}</h4>
          <p className="text-xs text-slate-300 max-w-xl">{active.description}</p>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentStep ? "w-5 bg-indigo-500" : "bg-slate-700"
              }`}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          {currentStep > 0 && (
            <button
              onClick={() => setCurrentStep((prev) => prev - 1)}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold"
            >
              Previous
            </button>
          )}

          {currentStep < STEPS.length - 1 ? (
            <button
              onClick={() => setCurrentStep((prev) => prev + 1)}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold"
            >
              Next Step →
            </button>
          ) : (
            <button
              onClick={handleDismiss}
              className="px-4 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold"
            >
              Get Started ✓
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
