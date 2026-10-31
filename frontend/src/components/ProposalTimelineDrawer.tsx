"use client";

import React from "react";
import { resolveAlias } from "../utils/addressBook";

export interface TimelineEvent {
  id: string;
  title: string;
  actor: string;
  timestamp: string;
  status: "completed" | "current" | "pending";
  details?: string;
}

interface ProposalTimelineDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  proposalTitle: string;
  events: TimelineEvent[];
}

export function ProposalTimelineDrawer({
  isOpen,
  onClose,
  proposalTitle,
  events,
}: ProposalTimelineDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 max-w-md w-full bg-slate-900 border-l border-slate-700 p-6 shadow-2xl flex flex-col text-slate-100 animate-in slide-in-from-right duration-200 text-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              ⏱️ Proposal Audit Timeline
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">{proposalTitle}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            ✕
          </button>
        </div>

        <div className="mt-6 flex-1 overflow-y-auto pr-1">
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
            {events.map((ev) => {
              const nodeColor =
                ev.status === "completed"
                  ? "bg-emerald-500 ring-4 ring-emerald-500/20"
                  : ev.status === "current"
                  ? "bg-indigo-500 ring-4 ring-indigo-500/20 animate-pulse"
                  : "bg-slate-700";

              return (
                <div key={ev.id} className="relative">
                  <span
                    className={`absolute -left-[19px] top-1 w-3 h-3 rounded-full ${nodeColor}`}
                  />
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{ev.title}</span>
                      <span className="text-[10px] text-slate-500">{ev.timestamp}</span>
                    </div>

                    <div className="text-[11px] text-indigo-400 font-mono">
                      By: {resolveAlias(ev.actor)}
                    </div>

                    {ev.details && (
                      <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-900 mt-1">
                        {ev.details}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
