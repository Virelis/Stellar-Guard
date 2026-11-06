"use client";

import React, { useState } from "react";
import { CopyButton } from "./CopyButton";
import { resolveAlias } from "../utils/addressBook";

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePublicKey: string | null;
  network?: string;
  onDisconnect?: () => void;
}

export function ProfileSettingsModal({
  isOpen,
  onClose,
  activePublicKey,
  network = "TESTNET",
  onDisconnect,
}: ProfileSettingsModalProps) {
  const [cleared, setCleared] = useState(false);

  if (!isOpen) return null;

  function handleClearCache() {
    localStorage.clear();
    setCleared(true);
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }

  const alias = activePublicKey ? resolveAlias(activePublicKey) : "Anonymous Observer";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-6 shadow-2xl relative text-slate-100 flex flex-col text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-base">👤</span>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Operator Profile & Session
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            ✕
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1.5">
            <span className="text-[10px] text-slate-500 uppercase block">Active Identity</span>
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-sm">{alias}</span>
              <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 text-[10px] font-bold px-2 py-0.5 rounded">
                {activePublicKey ? "Authorized Signer" : "Read Only"}
              </span>
            </div>

            {activePublicKey ? (
              <div className="pt-1 flex items-center justify-between">
                <span className="font-mono text-cyan-400 text-[11px] break-all select-all">
                  {activePublicKey}
                </span>
                <CopyButton text={activePublicKey} compact={true} />
              </div>
            ) : (
              <p className="text-slate-400 text-[11px] pt-1">
                No Freighter key connected. Connect your wallet to cast votes.
              </p>
            )}
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1.5">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-400">Target Stellar Network:</span>
              <span className="font-bold font-mono text-amber-400">{network}</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-400">Soroban RPC Protocol:</span>
              <span className="font-mono text-white">v22 (CAP-0077)</span>
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-slate-300 font-semibold block">Local Storage Cache</span>
              <span className="text-[10px] text-slate-500">Reset aliases and preferences</span>
            </div>
            <button
              onClick={handleClearCache}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-rose-400 rounded-lg font-semibold text-[11px] border border-slate-700"
            >
              {cleared ? "Cleared!" : "Reset Cache"}
            </button>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center">
          {onDisconnect && activePublicKey ? (
            <button
              onClick={() => {
                onDisconnect();
                onClose();
              }}
              className="text-rose-400 hover:underline font-semibold text-xs"
            >
              Disconnect Wallet
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
