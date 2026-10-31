"use client";

import React, { useState } from "react";

interface CopyButtonProps {
  text: string;
  label?: string;
  compact?: boolean;
  className?: string;
}

export function CopyButton({ text, label, compact = false, className = "" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
        navigator.vibrate(25); // subtle haptic pulse
      }
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={label || "Copy to clipboard"}
      title={copied ? "Copied!" : label || "Copy to clipboard"}
      className={`inline-flex items-center gap-1 text-slate-400 hover:text-white transition-colors rounded p-1 hover:bg-slate-800 ${className}`}
    >
      {copied ? (
        <span className="text-emerald-400 font-bold text-xs flex items-center gap-1">
          ✓ {!compact && (label ? "Copied!" : "")}
        </span>
      ) : (
        <span className="text-xs">
          📋 {!compact && label}
        </span>
      )}
    </button>
  );
}

