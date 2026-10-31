"use client";

import React, { useState, useEffect, useRef } from "react";

interface SessionInactivityWatcherProps {
  timeoutMinutes?: number;
  onTimeout: () => void;
  enabled?: boolean;
}

export function SessionInactivityWatcher({
  timeoutMinutes = 15,
  onTimeout,
  enabled = true,
}: SessionInactivityWatcherProps) {
  const [warningOpen, setWarningOpen] = useState(false);
  const [countdown, setCountdown] = useState(60);

  const timeoutMs = timeoutMinutes * 60 * 1000;
  const warningMs = Math.max(10000, timeoutMs - 60000); // 60s before timeout

  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const disconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  function resetTimers() {
    if (!enabled) return;

    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (disconnectTimerRef.current) clearTimeout(disconnectTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    setWarningOpen(false);
    setCountdown(60);

    warningTimerRef.current = setTimeout(() => {
      setWarningOpen(true);
      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, warningMs);

    disconnectTimerRef.current = setTimeout(() => {
      setWarningOpen(false);
      onTimeout();
    }, timeoutMs);
  }

  useEffect(() => {
    if (!enabled) return;

    const events = ["mousemove", "keydown", "touchstart", "scroll", "click"];
    const handleActivity = () => {
      if (!warningOpen) resetTimers();
    };

    events.forEach((ev) => window.addEventListener(ev, handleActivity, { passive: true }));
    resetTimers();

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, handleActivity));
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (disconnectTimerRef.current) clearTimeout(disconnectTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [enabled, timeoutMs, warningOpen]);

  if (!warningOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="bg-slate-900 border border-amber-500/50 rounded-2xl max-w-sm w-full p-6 shadow-2xl text-slate-100 text-center animate-in zoom-in-95 duration-150">
        <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto text-xl text-amber-400 mb-3">
          ⏳
        </div>

        <h3 className="text-base font-bold text-white">Inactivity Security Warning</h3>
        <p className="text-xs text-slate-400 mt-1">
          Your session has been idle. To protect multi-sig signing authority, your wallet will automatically disconnect in:
        </p>

        <div className="my-4 text-3xl font-black font-mono text-amber-400">
          {countdown}s
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => resetTimers()}
            className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-colors"
          >
            I&apos;m Still Here
          </button>
          <button
            onClick={() => {
              setWarningOpen(false);
              onTimeout();
            }}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg text-xs font-semibold transition-colors"
          >
            Disconnect Now
          </button>
        </div>
      </div>
    </div>
  );
}
