"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { isConnected, getPublicKey, getNetwork } from "@stellar/freighter-api";

export type WalletStatus = "disconnected" | "connecting" | "connected" | "network_mismatch" | "error";

interface WalletContextType {
  status: WalletStatus;
  publicKey: string | null;
  network: string | null;
  error: string | null;
  connect: () => Promise<string | null>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<WalletStatus>("disconnected");
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [network, setNetwork] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const autoConnect = localStorage.getItem("stellar_guard_wallet_autoconnect");
    if (autoConnect === "true") {
      void connect();
    }
  }, []);

  async function connect(): Promise<string | null> {
    setStatus("connecting");
    setError(null);

    try {
      const installed = await isConnected();
      if (!installed) {
        setStatus("error");
        setError("Freighter not installed");
        return null;
      }

      const key = await getPublicKey();
      if (!key) {
        setStatus("error");
        setError("No account selected in wallet");
        return null;
      }

      let net: string | null = null;
      try {
        if (typeof getNetwork === "function") {
          net = await getNetwork();
        }
      } catch {
        // non-fatal
      }

      setPublicKey(key);
      setNetwork(net || "TESTNET");
      setStatus("connected");
      localStorage.setItem("stellar_guard_wallet_autoconnect", "true");
      return key;
    } catch (err: any) {
      setStatus("error");
      const msg = err?.message || "Wallet connection failed";
      setError(msg);
      return null;
    }
  }

  function disconnect() {
    setPublicKey(null);
    setNetwork(null);
    setStatus("disconnected");
    setError(null);
    localStorage.removeItem("stellar_guard_wallet_autoconnect");
  }

  return (
    <WalletContext.Provider value={{ status, publicKey, network, error, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletContextType {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    return {
      status: "disconnected",
      publicKey: null,
      network: null,
      error: null,
      connect: async () => null,
      disconnect: () => {},
    };
  }
  return ctx;
}

