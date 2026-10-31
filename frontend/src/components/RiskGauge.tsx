"use client";

import React from "react";

interface RiskGaugeProps {
  score: number; // 0 - 100
  size?: number;
  level?: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
}

export function RiskGauge({ score, size = 180, level }: RiskGaugeProps) {
  const clamped = Math.max(0, Math.min(100, score));

  // Determine label if not passed
  const riskLevel =
    level ||
    (clamped >= 80 ? "CRITICAL" : clamped >= 55 ? "HIGH" : clamped >= 30 ? "MODERATE" : "LOW");

  // Needle angle: 0 score = -90deg (pointing left), 100 score = +90deg (pointing right)
  const angle = (clamped / 100) * 180 - 90;

  const color =
    riskLevel === "CRITICAL"
      ? "text-rose-500"
      : riskLevel === "HIGH"
      ? "text-orange-500"
      : riskLevel === "MODERATE"
      ? "text-amber-500"
      : "text-emerald-500";

  return (
    <div className="flex flex-col items-center select-none" style={{ width: size }}>
      <div className="relative" style={{ width: size, height: size / 2 + 20 }}>
        <svg viewBox="0 0 200 120" className="w-full h-full">
          {/* Gauge Arc Segments */}
          {/* Low (0-30) */}
          <path
            d="M 20 100 A 80 80 0 0 1 54 44"
            fill="none"
            stroke="#10b981"
            strokeWidth="16"
            strokeLinecap="round"
          />
          {/* Moderate (30-55) */}
          <path
            d="M 62 37 A 80 80 0 0 1 100 20"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="16"
          />
          {/* High (55-80) */}
          <path
            d="M 108 20 A 80 80 0 0 1 146 44"
            fill="none"
            stroke="#f97316"
            strokeWidth="16"
          />
          {/* Critical (80-100) */}
          <path
            d="M 154 52 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="#ef4444"
            strokeWidth="16"
            strokeLinecap="round"
          />

          {/* Needle Center Pivot */}
          <circle cx="100" cy="100" r="8" fill="#475569" />
          <circle cx="100" cy="100" r="4" fill="#ffffff" />

          {/* Needle Pointer */}
          <g
            style={{
              transform: `rotate(${angle}deg)`,
              transformOrigin: "100px 100px",
              transition: "transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          >
            <polygon points="98,100 102,100 100,28" fill="#f8fafc" />
          </g>
        </svg>

        {/* Center Digital Readout */}
        <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center">
          <span className={`text-2xl font-black font-mono leading-none ${color}`}>
            {clamped}
          </span>
          <span className="text-[10px] uppercase font-bold text-slate-400 mt-0.5">
            {riskLevel} RISK
          </span>
        </div>
      </div>
    </div>
  );
}

