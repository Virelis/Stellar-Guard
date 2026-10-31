"use client";

import React, { useState } from "react";
import { resolveAlias, getAddressBook } from "../utils/addressBook";
import { StellarExplorerLink } from "./StellarExplorerLink";

interface QuickAccountSearchProps {
  onSelectAccount?: (address: string) => void;
  onInitiateFreeze?: (address: string) => void;
}

export function QuickAccountSearch({
  onSelectAccount,
  onInitiateFreeze,
}: QuickAccountSearchProps) {
  const [query, setQuery] = useState("");
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);

  const contacts = getAddressBook();
  const filteredSuggestions = contacts.filter(
    (c) =>
      c.alias.toLowerCase().includes(query.toLowerCase()) ||
      c.address.toLowerCase().includes(query.toLowerCase())
  );

  const isValidAddress = query.startsWith("G") && query.length === 56;

  return (
    <div className="relative w-full text-xs">
      <div className="relative flex items-center">
        <span className="absolute left-3 text-slate-500">🔍</span>
        <input
          type="text"
          placeholder="Lookup account or alias... (G...)"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value.trim());
            setSuggestionsOpen(true);
          }}
          onFocus={() => setSuggestionsOpen(true)}
          className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-8 py-2 text-white font-mono text-xs focus:outline-none focus:border-indigo-500 placeholder:font-sans"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 text-slate-500 hover:text-white"
          >
            ✕
          </button>
        )}
      </div>

      {suggestionsOpen && query && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setSuggestionsOpen(false)} />
          <div className="absolute left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-40 overflow-hidden divide-y divide-slate-800">
            {isValidAddress && (
              <div className="p-3 bg-slate-950 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-emerald-400 font-bold uppercase block">
                    Valid Stellar Public Key
                  </span>
                  <span className="font-mono text-white text-[11px]">{resolveAlias(query)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <StellarExplorerLink type="account" value={query} />
                  {onInitiateFreeze && (
                    <button
                      onClick={() => {
                        onInitiateFreeze(query);
                        setSuggestionsOpen(false);
                      }}
                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[11px] font-bold"
                    >
                      Freeze
                    </button>
                  )}
                </div>
              </div>
            )}

            {filteredSuggestions.map((c) => (
              <div
                key={c.address}
                onClick={() => {
                  setQuery(c.address);
                  if (onSelectAccount) onSelectAccount(c.address);
                  setSuggestionsOpen(false);
                }}
                className="p-2.5 hover:bg-slate-800 cursor-pointer flex items-center justify-between transition-colors"
              >
                <div>
                  <span className="font-bold text-white block">{c.alias}</span>
                  <span className="font-mono text-[10px] text-slate-400">
                    {c.address.slice(0, 10)}…{c.address.slice(-6)}
                  </span>
                </div>
                {c.role && (
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                    {c.role}
                  </span>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
