"use client";

import React, { useState } from "react";

interface BatchProposalToolbarProps {
  selectedIds: string[];
  onClearSelection: () => void;
  onBatchApprove: (ids: string[]) => Promise<void>;
  onBatchReject: (ids: string[]) => Promise<void>;
}

export function BatchProposalToolbar({
  selectedIds,
  onClearSelection,
  onBatchApprove,
  onBatchReject,
}: BatchProposalToolbarProps) {
  const [submitting, setSubmitting] = useState(false);

  if (!selectedIds.length) return null;

  async function handleApprove() {
    setSubmitting(true);
    try {
      await onBatchApprove(selectedIds);
      onClearSelection();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReject() {
    setSubmitting(true);
    try {
      await onBatchReject(selectedIds);
      onClearSelection();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 border border-slate-700 p-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-4 text-xs animate-in slide-in-from-bottom-3 duration-150">
      <div className="flex items-center gap-2 pl-2">
        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
        <span className="font-bold text-white">
          {selectedIds.length} {selectedIds.length === 1 ? "Proposal" : "Proposals"} Selected
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleApprove}
          disabled={submitting}
          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold rounded-lg transition-all shadow-md shadow-indigo-600/30 disabled:opacity-50"
        >
          {submitting ? "Processing..." : `Batch Vote & Sign (${selectedIds.length})`}
        </button>

        <button
          onClick={handleReject}
          disabled={submitting}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-rose-400 font-semibold rounded-lg transition-colors border border-slate-700"
        >
          Reject All
        </button>

        <button
          onClick={onClearSelection}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          title="Deselect all"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

