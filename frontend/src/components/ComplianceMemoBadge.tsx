"use client";

import React from "react";
import { CopyButton } from "./CopyButton";

interface ComplianceMemoBadgeProps {
  memo?: string;
  memoType?: string;
}

export function ComplianceMemoBadge({ memo, memoType = "text" }: ComplianceMemoBadgeProps) {
  if (!memo || memo === "none") return null;

  const str = memo.trim();

  // 1. FATF Travel rule match
  if (/^(?:TR-|IVMS:?)[A-Za-z0-9_-]+/i.test(str)) {
    return (
      <span className="inline-flex items-center gap-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px] font-mono px-2 py-0.5 rounded font-bold" title="FATF Travel Rule Reference Identifier">
        <span>✈️ Travel Rule:</span>
        <span>{str}</span>
        <CopyButton text={str} compact={true} />
      </span>
    );
  }

  // 2. Incident Ticket match
  if (/^(?:INC|CASE|SEC|ALERT)-[A-Za-z0-9_-]+/i.test(str)) {
    return (
      <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-mono px-2 py-0.5 rounded font-bold" title="Security Incident Reference Ticket">
        <span>🚨 Incident:</span>
        <span>{str}</span>
        <CopyButton text={str} compact={true} />
      </span>
    );
  }

  // 3. Invoice match
  if (/^(?:INV|PAY)-[A-Za-z0-9_-]+/i.test(str)) {
    return (
      <span className="inline-flex items-center gap-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 text-[10px] font-mono px-2 py-0.5 rounded font-bold" title="Invoice Payment Reference">
        <span>🧾 Invoice:</span>
        <span>{str}</span>
        <CopyButton text={str} compact={true} />
      </span>
    );
  }

  // 4. Hash Digest match
  if (memoType === "hash" || /^[0-9a-fA-F]{64}$/.test(str)) {
    return (
      <span className="inline-flex items-center gap-1 bg-purple-500/10 text-purple-400 border border-purple-500/30 text-[10px] font-mono px-2 py-0.5 rounded" title="Cryptographic Hash Digest">
        <span>#️⃣ Hash:</span>
        <span>{str.slice(0, 8)}…{str.slice(-6)}</span>
        <CopyButton text={str} compact={true} />
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-mono px-2 py-0.5 rounded">
      <span>Memo: {str.length > 20 ? `${str.slice(0, 18)}…` : str}</span>
      <CopyButton text={str} compact={true} />
    </span>
  );
}
