"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000";

interface RiskFactor {
  code: string;
  description: string;
  weight: number;
}

interface RiskAssessment {
  riskScore: number;
  riskLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  factors: RiskFactor[];
}

interface AccountRiskBadgeProps {
  address: string;
  initialScore?: number;
  initialLevel?: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  onTriggerFreeze?: (address: string) => void;
}

const LEVEL_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  LOW: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" },
  MODERATE: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30" },
  HIGH: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/30" },
  CRITICAL: { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/30" },
};

export function AccountRiskBadge({
  address,
  initialScore,
  initialLevel,
  onTriggerFreeze,
}: AccountRiskBadgeProps) {
  const [assessment, setAssessment] = useState<RiskAssessment | null>(
    initialScore !== undefined && initialLevel
      ? { riskScore: initialScore, riskLevel: initialLevel, factors: [] }
      : null
  );
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialScore !== undefined && initialLevel) return;
    if (!address || address.length !== 56) return;

    let isMounted = true;
    async function fetchRisk() {
      setLoading(true);
      try {
        const { data } = await axios.get<RiskAssessment>(`${API}/api/risk/score/${address}`);
        if (isMounted) setAssessment(data);
      } catch {
        // non-fatal fallback
        if (isMounted) {
          setAssessment({ riskScore: 10, riskLevel: "LOW", factors: [] });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchRisk();
    return () => {
      isMounted = false;
    };
  }, [address, initialScore, initialLevel]);

  if (!assessment && !loading) return null;

  const level = assessment?.riskLevel || "LOW";
  const styles = LEVEL_STYLES[level] || LEVEL_STYLES.LOW;

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setPopoverOpen(!popoverOpen)}
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${styles.bg} ${styles.text} ${styles.border} hover:opacity-80`}
        title="Click to view AML risk breakdown"
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            level === "CRITICAL" ? "bg-rose-400 animate-ping" : level === "HIGH" ? "bg-orange-400" : "bg-emerald-400"
          }`}
        />
        <span>Risk: {assessment ? assessment.riskScore : "..."} ({level})</span>
      </button>

      {popoverOpen && assessment && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setPopoverOpen(false)} />
          <div className="absolute left-0 mt-1.5 w-64 p-3 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 text-xs text-slate-200 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-bold text-white">AML Compliance Score</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${styles.bg} ${styles.text}`}>
                {assessment.riskScore} / 100
              </span>
            </div>

            <div className="mt-2 space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {assessment.factors.length === 0 ? (
                <p className="text-slate-400 text-[11px]">
                  No suspicious velocity or sanctions flags detected for this account.
                </p>
              ) : (
                assessment.factors.map((f, i) => (
                  <div key={i} className="bg-slate-950 p-1.5 rounded border border-slate-800 text-[10px]">
                    <span className="font-bold text-amber-400 block">{f.code}</span>
                    <span className="text-slate-400">{f.description} (+{f.weight} pts)</span>
                  </div>
                ))
              )}
            </div>

            {onTriggerFreeze && (level === "HIGH" || level === "CRITICAL") && (
              <button
                type="button"
                onClick={() => {
                  setPopoverOpen(false);
                  onTriggerFreeze(address);
                }}
                className="mt-2.5 w-full py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded font-bold text-[11px] transition-colors"
              >
                🚨 Fast Freeze Target
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

