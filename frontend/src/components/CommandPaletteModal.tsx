"use client";

import React, { useState, useEffect } from "react";

export interface CommandAction {
  id: string;
  title: string;
  shortcut: string;
  category: string;
  icon: string;
  perform: () => void;
}

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  actions: CommandAction[];
}

export function CommandPaletteModal({ isOpen, onClose, actions }: CommandPaletteModalProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filtered = actions.filter((a) =>
    a.title.toLowerCase().includes(query.toLowerCase()) ||
    a.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isOpen) return;

      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].perform();
          onClose();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, filtered, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/75 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-4 shadow-2xl relative text-slate-100 overflow-hidden">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <span className="text-slate-400 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Type a command or action... (↑/↓ to navigate, Enter to run, Esc to close)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent border-none text-white text-xs focus:outline-none placeholder:text-slate-500"
            autoFocus
          />
        </div>

        <div className="mt-3 max-h-64 overflow-y-auto space-y-1">
          {filtered.length === 0 ? (
            <p className="text-center py-6 text-xs text-slate-500">No matching actions found</p>
          ) : (
            filtered.map((action, idx) => (
              <div
                key={action.id}
                onClick={() => {
                  action.perform();
                  onClose();
                }}
                className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer text-xs transition-colors ${
                  idx === selectedIndex
                    ? "bg-indigo-600 text-white font-semibold"
                    : "hover:bg-slate-800/60 text-slate-300"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span>{action.icon}</span>
                  <span>{action.title}</span>
                  <span className="text-[10px] opacity-60">({action.category})</span>
                </div>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-950/80 text-[10px] font-mono border border-slate-800">
                  {action.shortcut}
                </kbd>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

