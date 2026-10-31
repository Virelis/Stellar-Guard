"use client";

import React, { useState, useEffect } from "react";
import { playAlertSound, isSoundEnabled, setSoundEnabled } from "../utils/soundEffects";

export function AudioSettingsCard() {
  const [enabled, setEnabled] = useState(true);
  const [volume, setVolume] = useState(80);

  useEffect(() => {
    setEnabled(isSoundEnabled());
    const savedVol = localStorage.getItem("stellar_guard_sound_volume");
    if (savedVol) setVolume(Number(savedVol));
  }, []);

  function handleToggleEnabled() {
    const next = !enabled;
    setEnabled(next);
    setSoundEnabled(next);
    if (next) playAlertSound("success");
  }

  function handleVolumeChange(val: number) {
    setVolume(val);
    localStorage.setItem("stellar_guard_sound_volume", String(val));
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg text-xs text-slate-200">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-base">🔊</span>
          <h4 className="font-bold text-white">Audio Alert Settings</h4>
        </div>
        <button
          onClick={handleToggleEnabled}
          className={`px-2 py-1 rounded-md text-[10px] font-bold border ${
            enabled
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
              : "bg-slate-800 text-slate-400 border-slate-700"
          }`}
        >
          {enabled ? "Enabled" : "Muted"}
        </button>
      </div>

      <div className="mt-3 space-y-3">
        <div>
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-slate-400">Master Alert Volume</span>
            <span className="font-mono text-white">{volume}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={volume}
            disabled={!enabled}
            onChange={(e) => handleVolumeChange(Number(e.target.value))}
            className="w-full accent-indigo-500 cursor-pointer disabled:opacity-40"
          />
        </div>

        <div className="pt-2 border-t border-slate-800">
          <span className="text-[10px] text-slate-500 uppercase block mb-1.5">
            Test Alert Synthesizers
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => playAlertSound("critical")}
              disabled={!enabled}
              className="py-1.5 px-2 bg-slate-950 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/40 rounded-lg text-rose-400 font-semibold text-[11px] transition-colors disabled:opacity-40"
            >
              🚨 Critical
            </button>
            <button
              onClick={() => playAlertSound("success")}
              disabled={!enabled}
              className="py-1.5 px-2 bg-slate-950 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-500/40 rounded-lg text-emerald-400 font-semibold text-[11px] transition-colors disabled:opacity-40"
            >
              ✓ Success
            </button>
            <button
              onClick={() => playAlertSound("notification")}
              disabled={!enabled}
              className="py-1.5 px-2 bg-slate-950 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/40 rounded-lg text-indigo-400 font-semibold text-[11px] transition-colors disabled:opacity-40"
            >
              🔔 Ping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
