"use client";

import React, { useState, useEffect } from "react";

interface AutoRefreshIndicatorProps {
  intervalSeconds?: number;
  onRefresh: () => void;
}

export function AutoRefreshIndicator({
  intervalSeconds = 15,
  onRefresh,
}: AutoRefreshIndicatorProps) {
  const [secondsRemaining, setSecondsRemaining] = useState(intervalSeconds);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          onRefresh();
          return intervalSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPaused, intervalSeconds, onRefresh]);

  function handleManualRefresh() {
    onRefresh();
    setSecondsRemaining(intervalSeconds);
  }

  const progressPercent = ((intervalSeconds - secondsRemaining) / intervalSeconds) * 100;

  return (
    <div className="inline-flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-400">
      <div className="relative w-3.5 h-3.5 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
          <path
            className="text-slate-800"
            strokeWidth="4"
            stroke="currentColor"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <path
            className={isPaused ? "text-amber-500" : "text-indigo-400 transition-all duration-1000"}
            strokeDasharray={`${progressPercent}, 100`}
            strokeWidth="4"
            strokeLinecap="round"
            stroke="currentColor"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
      </div>

      <span className="font-mono text-[11px] text-slate-300">
        {isPaused ? "Paused" : `${secondsRemaining}s`}
      </span>

      <div className="flex items-center gap-1 border-l border-slate-800 pl-1.5 ml-0.5">
        <button
          type="button"
          onClick={() => setIsPaused(!isPaused)}
          className="text-slate-500 hover:text-white p-0.5 rounded"
          title={isPaused ? "Resume auto-refresh" : "Pause auto-refresh"}
        >
          {isPaused ? "▶" : "⏸"}
        </button>

        <button
          type="button"
          onClick={handleManualRefresh}
          className="text-slate-500 hover:text-white p-0.5 rounded"
          title="Refresh immediately"
        >
          🔄
        </button>
      </div>
    </div>
  );
}
