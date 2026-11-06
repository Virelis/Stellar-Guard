"use client";

import React, { useState } from "react";

export type IncidentCategory =
  "OFAC_SANCTIONS" | "EXPLOIT_DRAIN" | "COMPROMISED_KEY" | "COURT_ORDER" | "AML_HIGH_RISK";

interface ProposalCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (proposal: {
    assetCode: string;
    issuer: string;
    target: string;
    category: IncidentCategory;
    referenceTicket: string;
  }) => Promise<void> | void;
  adminPublicKey?: string | null;
}

const CATEGORIES: Array<{ id: IncidentCategory; label: string; color: string }> = [
  {
    id: "EXPLOIT_DRAIN",
    label: "Protocol Drain / Exploit",
    color: "bg-red-500/10 text-red-400 border-red-500/40",
  },
  {
    id: "COMPROMISED_KEY",
    label: "Compromised Private Key",
    color: "bg-orange-500/10 text-orange-400 border-orange-500/40",
  },
  {
    id: "OFAC_SANCTIONS",
    label: "OFAC / Sanctions Match",
    color: "bg-purple-500/10 text-purple-400 border-purple-500/40",
  },
  {
    id: "AML_HIGH_RISK",
    label: "AML Velocity Flag",
    color: "bg-amber-500/10 text-amber-400 border-amber-500/40",
  },
  {
    id: "COURT_ORDER",
    label: "Legal / Court Order",
    color: "bg-blue-500/10 text-blue-400 border-blue-500/40",
  },
];

export function ProposalCreationModal({
  isOpen,
  onClose,
  onSubmit,
  adminPublicKey,
}: ProposalCreationModalProps) {
  const [assetCode, setAssetCode] = useState("USDC");
  const [issuer, setIssuer] = useState("");
  const [target, setTarget] = useState("");
  const [category, setCategory] = useState<IncidentCategory>("EXPLOIT_DRAIN");
  const [referenceTicket, setReferenceTicket] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const trimmedTarget = target.trim();
    if (!trimmedTarget.startsWith("G") || trimmedTarget.length !== 56) {
      setFormError("Target must be a valid 56-character Stellar public key starting with 'G'");
      return;
    }

    if (issuer.trim() && (issuer.trim().length !== 56 || !issuer.trim().startsWith("G"))) {
      setFormError("Issuer must be a valid 56-character Stellar public key starting with 'G'");
      return;
    }

    if (trimmedTarget === issuer.trim()) {
      setFormError("Target account cannot be the same as the asset issuer");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        assetCode: assetCode.toUpperCase().trim(),
        issuer: issuer.trim(),
        target: trimmedTarget,
        category,
        referenceTicket: referenceTicket.trim(),
      });
      onClose();
    } catch (err: any) {
      setFormError(err?.message || "Failed to initiate freeze proposal");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-6 shadow-2xl relative text-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              🛡️ Propose Asset Quarantine
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Submit a multi-sig proposal to freeze compromised asset balance
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="text-slate-400 hover:text-white rounded-lg p-1.5 transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Asset Code</label>
            <div className="grid grid-cols-3 gap-2">
              {["USDC", "EURC", "CUSTOM"].map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setAssetCode(code === "CUSTOM" ? "" : code)}
                  className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all ${
                    (code === "CUSTOM" && !["USDC", "EURC"].includes(assetCode)) ||
                    assetCode === code
                      ? "bg-indigo-600 border-indigo-400 text-white"
                      : "bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600"
                  }`}
                >
                  {code}
                </button>
              ))}
            </div>
            {!["USDC", "EURC"].includes(assetCode) && (
              <input
                type="text"
                placeholder="Custom Asset Code (e.g. AQUA)"
                value={assetCode}
                onChange={(e) => setAssetCode(e.target.value.toUpperCase())}
                className="mt-2 w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                required
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Asset Issuer Address (Public Key)
            </label>
            <input
              type="text"
              placeholder="G..."
              value={issuer}
              onChange={(e) => setIssuer(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Target Account to Quarantine
            </label>
            <input
              type="text"
              placeholder="G... (address to be frozen)"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Incident Category
            </label>
            <div className="grid grid-cols-1 gap-1.5 max-h-36 overflow-y-auto pr-1">
              {CATEGORIES.map((cat) => (
                <label
                  key={cat.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-xs transition-all ${
                    category === cat.id
                      ? `${cat.color} font-semibold ring-1 ring-indigo-500`
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="category"
                    value={cat.id}
                    checked={category === cat.id}
                    onChange={() => setCategory(cat.id)}
                    className="sr-only"
                  />
                  <span>{cat.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Incident Ticket / Travel Rule Reference (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. INC-2026-9041 or TR-USDC-002"
              value={referenceTicket}
              onChange={(e) => setReferenceTicket(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          {formError && (
            <div className="bg-red-500/10 border border-red-500/40 text-red-400 rounded-lg p-2.5 text-xs">
              {formError}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white px-5 py-2 rounded-lg text-xs font-semibold transition-all shadow-md shadow-indigo-600/30 disabled:opacity-50"
            >
              {submitting ? "Building Proposal..." : "Submit Proposal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
