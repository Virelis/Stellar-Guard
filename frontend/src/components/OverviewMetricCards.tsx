"use client";

import React from "react";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  icon: string;
  subtitle?: string;
}

function MetricCard({ title, value, change, isPositive, icon, subtitle }: MetricCardProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg hover:border-slate-700 transition-all flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400">{title}</span>
        <span className="text-lg p-1.5 rounded-lg bg-slate-950 border border-slate-800/80">
          {icon}
        </span>
      </div>

      <div className="mt-3">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-white tracking-tight">{value}</span>
          {change && (
            <span
              className={`text-[11px] font-bold px-1.5 py-0.2 rounded ${
                isPositive
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
              }`}
            >
              {change}
            </span>
          )}
        </div>
        {subtitle && <p className="text-[11px] text-slate-500 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}

interface OverviewMetricCardsProps {
  activeProposalsCount?: number;
  quarantinedCount?: number;
  monitoredVolume24h?: string;
  avgQuorumLatency?: string;
}

export function OverviewMetricCards({
  activeProposalsCount = 3,
  quarantinedCount = 14,
  monitoredVolume24h = "$1,842,500",
  avgQuorumLatency = "3.2 mins",
}: OverviewMetricCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="Quarantined Accounts"
        value={quarantinedCount}
        change="+2 this week"
        isPositive={true}
        icon="🔒"
        subtitle="Active CAP-0077 frozen trustlines"
      />
      <MetricCard
        title="Pending Quorum Proposals"
        value={activeProposalsCount}
        change="Awaiting votes"
        isPositive={false}
        icon="⚖️"
        subtitle="Multi-sig compliance votes in progress"
      />
      <MetricCard
        title="24h Monitored Volume"
        value={monitoredVolume24h}
        change="+14.2%"
        isPositive={true}
        icon="📊"
        subtitle="USDC & EURC transfer throughput"
      />
      <MetricCard
        title="Avg Quorum Resolution"
        value={avgQuorumLatency}
        change="SLA Met"
        isPositive={true}
        icon="⏱️"
        subtitle="Median consensus latency"
      />
    </div>
  );
}
