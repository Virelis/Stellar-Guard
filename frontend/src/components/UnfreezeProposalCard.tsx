"use client";

import React, { useState } from "react";
import { QuorumMeter } from "./QuorumMeter";
import { resolveAlias } from "../utils/addressBook";

interface UnfreezeProposalCardProps {
  assetCode: string;
  targetAddress: string;
  issuer: string;
  currentVotes?: number;
  requiredQuorum?: number;
  onVoteUnfreeze?: (target: string) => Promise<void>;
  adminKey?: string | null;
}

export function UnfreezeProposalCard({
  assetCode,
  targetAddress,
  issuer,
  currentVotes = 1,
  requiredQuorum = 3,
  onVoteUnfreeze,
  adminKey,
}: UnfreezeProposalCardProps) {
  const [justification, setJustification] = useState("REMEDIATION_COMPLETE");
  const [submitting, setSubmitting] = useState(false);
  const [voted, setVoted] = useState(false);

  async function handleVote() {
    if (!onVoteUnfreeze) return;
    setSubmitting(true);
    try {
      await onVoteUnfreeze(targetAddress);
      setVoted(true);
    } catch {
      // non-fatal
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg text-slate-200">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 text-sm">🔓</span>
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
            Unfreeze Remittance Motion
          </h4>
        </div>
        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-semibold">
          Asset: {assetCode}
        </span>
      </div>

      <div className="mt-3 space-y-2 text-xs">
        <div>
          <span className="text-[10px] text-slate-500 uppercase block">Quarantined Account</span>
          <span className="font-mono text-cyan-400 block select-all">
            {resolveAlias(targetAddress)} ({targetAddress.slice(0, 8)}…{targetAddress.slice(-6)})
          </span>
        </div>

        <div>
          <span className="text-[10px] text-slate-500 uppercase block">Justification Reason</span>
          <select
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 mt-1"
          >
            <option value="REMEDIATION_COMPLETE">Remediation Complete & KYC Re-verified</option>
            <option value="FALSE_POSITIVE">Investigative False Positive</option>
            <option value="COURT_CLEARANCE">Official Regulatory / Court Clearance Order</option>
            <option value="INSURANCE_SETTLED">Insurance Claim Subrogated</option>
          </select>
        </div>

        <div className="pt-2">
          <QuorumMeter
            currentVotes={voted ? currentVotes + 1 : currentVotes}
            requiredQuorum={requiredQuorum}
            variant="linear"
          />
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={handleVote}
            disabled={submitting || voted || !adminKey}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
          >
            {voted ? "✓ Vote Cast" : submitting ? "Casting Vote..." : "Vote to Unfreeze (Sign)"}
          </button>
        </div>
      </div>
    </div>
  );
}
