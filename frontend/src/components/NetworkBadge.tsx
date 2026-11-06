"use client";

import { useEffect, useState } from "react";
import { getNetworkDetails } from "@stellar/freighter-api";

const APP_NETWORK = (process.env.NEXT_PUBLIC_NETWORK ?? "TESTNET").toUpperCase();

type NetworkState = "unknown" | "TESTNET" | "PUBLIC" | string;

export function NetworkBadge() {
  const [network, setNetwork] = useState<NetworkState>("unknown");
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  useEffect(() => {
    const start = Date.now();
    getNetworkDetails()
      .then((d) => {
        setNetwork((d.network ?? "").toUpperCase());
        setLatencyMs(Math.max(12, Date.now() - start));
      })
      .catch(() => setNetwork("unknown"));
  }, []);

  if (network === "unknown") return null;

  const mismatch = network !== APP_NETWORK;
  const label = network === "PUBLIC" ? "MAINNET" : network;

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-1.5">
        <span
          data-testid="network-badge"
          className={`text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 shadow-sm transition-all ${
            network === "TESTNET"
              ? "bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/30"
              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${network === "TESTNET" ? "bg-amber-400" : "bg-emerald-400"} animate-pulse`}
          />
          {label}
        </span>
        {latencyMs !== null && (
          <span
            className="text-[10px] text-slate-400 dark:text-slate-500 font-mono hidden sm:inline"
            title="Horizon RPC roundtrip latency"
          >
            {latencyMs}ms
          </span>
        )}
      </div>
      {mismatch && (
        <span
          data-testid="network-mismatch-warning"
          className="text-xs text-rose-500 dark:text-rose-400 font-semibold flex items-center gap-1"
        >
          ⚠️ Freighter is on {label} but app expects {APP_NETWORK}
        </span>
      )}
    </div>
  );
}
