"use client";

import React, { useState, useEffect } from "react";
import { isSoundEnabled, setSoundEnabled, playAlertSound } from "../utils/soundEffects";

export function AudioAlertToggle() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    setEnabled(isSoundEnabled());
  }, []);

  function toggle() {
    const next = !enabled;
    setEnabled(next);
    setSoundEnabled(next);
    if (next) {
      playAlertSound("success");
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={enabled ? "Mute audio alert sounds" : "Unmute audio alert sounds"}
      title={enabled ? "Auditory alerts enabled (click to mute)" : "Auditory alerts muted (click to unmute)"}
      className={`p-2 rounded-lg text-xs border transition-colors shadow-sm ${
        enabled
          ? "bg-slate-800/80 border-slate-700 text-indigo-400 hover:border-slate-600"
          : "bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-400"
      }`}
    >
      {enabled ? "🔔" : "🔕"}
    </button>
  );
}

