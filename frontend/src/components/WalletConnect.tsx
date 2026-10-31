"use client";

import { useState } from "react";
import { getPublicKey, isConnected } from "@stellar/freighter-api";

interface Props {
  onConnect?: (key: string) => void;
}

export function WalletConnect({ onConnect }: Props) {
  const [key, setKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  async function connect() {
    setError(null);
    setConnecting(true);
    try {
      const connected = await isConnected();
      if (!connected) {
        setError("Freighter not installed");
        setConnecting(false);
        return;
      }
      const pk = await getPublicKey();
      setKey(pk);
      if (onConnect) onConnect(pk);
    } catch (err: any) {
      setError(err?.message ?? "Wallet connection failed");
    } finally {
      setConnecting(false);
    }
  }

  function disconnect() {
    setKey(null);
    setError(null);
  }

  if (key) {
    return (
      <div className="flex items-center gap-2">
        <div className="bg-slate-100 dark:bg-stellar-card border border-indigo-500/50 rounded-lg px-3 py-1.5 text-xs font-mono text-indigo-400 flex items-center gap-2 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{key.slice(0, 6)}…{key.slice(-4)}</span>
        </div>
        <button
          onClick={disconnect}
          aria-label="Disconnect wallet"
          className="text-xs text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/50 rounded px-2 py-1 transition-colors"
          title="Disconnect wallet"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={connect}
        disabled={connecting}
        className="bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-md shadow-indigo-500/20 disabled:opacity-50"
      >
        {connecting ? "Connecting..." : "Connect Freighter"}
      </button>
      {error && <span className="text-rose-500 dark:text-rose-400 text-xs font-medium">{error}</span>}
    </div>
  );
}
