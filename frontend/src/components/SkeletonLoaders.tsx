"use client";

import React from "react";

export function ProposalCardSkeleton() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md space-y-3 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-4 w-28 bg-slate-800 rounded" />
        <div className="h-4 w-16 bg-slate-800 rounded-full" />
      </div>
      <div className="space-y-1.5">
        <div className="h-3 w-48 bg-slate-800/80 rounded" />
        <div className="h-3 w-36 bg-slate-800/60 rounded" />
      </div>
      <div className="h-2 w-full bg-slate-800 rounded-full" />
      <div className="flex justify-end pt-2">
        <div className="h-7 w-20 bg-slate-800 rounded-lg" />
      </div>
    </div>
  );
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr className="animate-pulse border-b border-slate-800/60">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="py-3 px-3">
          <div className="h-3 bg-slate-800/80 rounded w-full max-w-[120px]" />
        </td>
      ))}
    </tr>
  );
}

export function MetricCardSkeleton() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg animate-pulse space-y-3">
      <div className="flex justify-between items-center">
        <div className="h-3 w-24 bg-slate-800 rounded" />
        <div className="h-6 w-6 bg-slate-800 rounded" />
      </div>
      <div className="h-7 w-20 bg-slate-800 rounded mt-2" />
      <div className="h-2.5 w-32 bg-slate-800/60 rounded" />
    </div>
  );
}
