"use client";

import React, { ReactNode } from "react";

interface VirtualScrollTableProps {
  children: ReactNode;
  maxHeight?: string;
  totalCount?: number;
  displayedCount?: number;
}

export function VirtualScrollTable({
  children,
  maxHeight = "420px",
  totalCount,
  displayedCount,
}: VirtualScrollTableProps) {
  return (
    <div className="w-full flex flex-col rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden text-xs">
      <div
        className="overflow-y-auto overflow-x-auto divide-y divide-slate-800"
        style={{ maxHeight }}
      >
        {children}
      </div>

      {totalCount !== undefined && displayedCount !== undefined && totalCount > displayedCount && (
        <div className="bg-slate-950/80 px-4 py-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>Displaying latest {displayedCount} records</span>
          <span>{totalCount - displayedCount} older transactions buffered</span>
        </div>
      )}
    </div>
  );
}
