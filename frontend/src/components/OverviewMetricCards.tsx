"use client";

import React, { useEffect, useRef, useState } from "react";

/* ── Animated number hook ─────────────────────────────────────── */
function useCountUp(target: number, duration = 1200): number {
  const [current, setCurrent] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(eased * target));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return current;
}

/* ── Card accent colour configs ──────────────────────────────── */
type AccentColor = "indigo" | "violet" | "cyan" | "emerald";

const ACCENT: Record<AccentColor, {
  iconGradient: string;
  iconShadow: string;
  cardBorder: string;
  cardGlow: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  valueShadow: string;
  topLine: string;
}> = {
  indigo: {
    iconGradient:  "linear-gradient(135deg, #4338ca 0%, #6366f1 60%, #818cf8 100%)",
    iconShadow:    "0 0 12px rgba(99,102,241,0.6), 0 0 24px rgba(99,102,241,0.3)",
    cardBorder:    "rgba(99,102,241,0.25)",
    cardGlow:      "0 0 20px rgba(99,102,241,0.08), 0 4px 24px rgba(0,0,0,0.45)",
    badgeBg:       "rgba(99,102,241,0.12)",
    badgeText:     "#818cf8",
    badgeBorder:   "rgba(99,102,241,0.3)",
    valueShadow:   "0 0 20px rgba(129,140,248,0.3)",
    topLine:       "linear-gradient(90deg, transparent, rgba(99,102,241,0.6), transparent)",
  },
  violet: {
    iconGradient:  "linear-gradient(135deg, #6d28d9 0%, #8b5cf6 60%, #a78bfa 100%)",
    iconShadow:    "0 0 12px rgba(139,92,246,0.6), 0 0 24px rgba(139,92,246,0.3)",
    cardBorder:    "rgba(139,92,246,0.25)",
    cardGlow:      "0 0 20px rgba(139,92,246,0.08), 0 4px 24px rgba(0,0,0,0.45)",
    badgeBg:       "rgba(139,92,246,0.12)",
    badgeText:     "#a78bfa",
    badgeBorder:   "rgba(139,92,246,0.3)",
    valueShadow:   "0 0 20px rgba(167,139,250,0.3)",
    topLine:       "linear-gradient(90deg, transparent, rgba(139,92,246,0.6), transparent)",
  },
  cyan: {
    iconGradient:  "linear-gradient(135deg, #0e7490 0%, #06b6d4 60%, #22d3ee 100%)",
    iconShadow:    "0 0 12px rgba(6,182,212,0.6), 0 0 24px rgba(6,182,212,0.3)",
    cardBorder:    "rgba(6,182,212,0.25)",
    cardGlow:      "0 0 20px rgba(6,182,212,0.08), 0 4px 24px rgba(0,0,0,0.45)",
    badgeBg:       "rgba(6,182,212,0.12)",
    badgeText:     "#22d3ee",
    badgeBorder:   "rgba(6,182,212,0.3)",
    valueShadow:   "0 0 20px rgba(34,211,238,0.3)",
    topLine:       "linear-gradient(90deg, transparent, rgba(6,182,212,0.6), transparent)",
  },
  emerald: {
    iconGradient:  "linear-gradient(135deg, #065f46 0%, #059669 60%, #34d399 100%)",
    iconShadow:    "0 0 12px rgba(5,150,105,0.6), 0 0 24px rgba(5,150,105,0.3)",
    cardBorder:    "rgba(34,197,94,0.25)",
    cardGlow:      "0 0 20px rgba(34,197,94,0.08), 0 4px 24px rgba(0,0,0,0.45)",
    badgeBg:       "rgba(34,197,94,0.12)",
    badgeText:     "#4ade80",
    badgeBorder:   "rgba(34,197,94,0.3)",
    valueShadow:   "0 0 20px rgba(74,222,128,0.3)",
    topLine:       "linear-gradient(90deg, transparent, rgba(34,197,94,0.6), transparent)",
  },
};

/* ── Single Metric Card ─────────────────────────────────────── */
interface MetricCardProps {
  title: string;
  value: string | number;
  numericValue?: number;   // If provided, count-up animation runs on this
  change?: string;
  isPositive?: boolean;
  icon: string;
  subtitle?: string;
  accent: AccentColor;
}

function MetricCard({
  title,
  value,
  numericValue,
  change,
  isPositive,
  icon,
  subtitle,
  accent,
}: MetricCardProps) {
  const a = ACCENT[accent];
  const animated = useCountUp(numericValue ?? 0, 1400);
  const displayValue = numericValue !== undefined ? animated : value;

  return (
    <div
      className="relative rounded-2xl overflow-hidden group cursor-default transition-all duration-300"
      style={{
        background: "linear-gradient(135deg, rgba(15,23,42,0.75) 0%, rgba(10,15,30,0.88) 100%)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: `1px solid ${a.cardBorder}`,
        boxShadow: a.cardGlow,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          a.cardGlow.replace("0.08", "0.15").replace("0.45", "0.55") +
          `, 0 0 0 1px ${a.cardBorder}`;
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = a.cardGlow;
        (e.currentTarget as HTMLDivElement).style.transform = "";
      }}
    >
      {/* Top neon accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: a.topLine }}
      />

      {/* Inner content */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          {/* Title */}
          <span
            className="text-xs font-semibold tracking-wide uppercase"
            style={{ color: "#6b7fa3" }}
          >
            {title}
          </span>

          {/* Icon with gradient background */}
          <div
            className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-transform duration-300 group-hover:scale-110"
            style={{
              background: a.iconGradient,
              boxShadow: a.iconShadow,
            }}
          >
            {icon}
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-baseline gap-2.5">
            <span
              className="text-3xl font-black text-white tracking-tight tabular-nums"
              style={{ textShadow: a.valueShadow }}
            >
              {displayValue}
            </span>
            {change && (
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full tracking-wide"
                style={{
                  background: isPositive
                    ? "rgba(34,197,94,0.12)"
                    : "rgba(245,158,11,0.12)",
                  color:  isPositive ? "#4ade80" : "#fbbf24",
                  border: `1px solid ${isPositive ? "rgba(34,197,94,0.25)" : "rgba(245,158,11,0.25)"}`,
                }}
              >
                {isPositive ? "↑" : "●"} {change}
              </span>
            )}
          </div>

          {subtitle && (
            <p
              className="text-[11px] mt-1.5 font-medium"
              style={{ color: "#4a5568" }}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Bottom shimmer on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 60% 40% at 50% 100%, ${a.cardBorder.replace("0.25", "0.06")} 0%, transparent 70%)`,
        }}
      />
    </div>
  );
}

/* ── OverviewMetricCards ────────────────────────────────────── */
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
        numericValue={quarantinedCount}
        change="+ 2 this week"
        isPositive={true}
        icon="🔒"
        subtitle="Active CAP-0077 frozen trustlines"
        accent="indigo"
      />
      <MetricCard
        title="Pending Proposals"
        value={activeProposalsCount}
        numericValue={activeProposalsCount}
        change="Awaiting votes"
        isPositive={false}
        icon="⚖️"
        subtitle="Multi-sig compliance votes in progress"
        accent="violet"
      />
      <MetricCard
        title="24h Monitored Volume"
        value={monitoredVolume24h}
        change="+ 14.2%"
        isPositive={true}
        icon="📊"
        subtitle="USDC & EURC transfer throughput"
        accent="cyan"
      />
      <MetricCard
        title="Avg Quorum Resolution"
        value={avgQuorumLatency}
        change="SLA Met"
        isPositive={true}
        icon="⏱️"
        subtitle="Median consensus latency"
        accent="emerald"
      />
    </div>
  );
}
