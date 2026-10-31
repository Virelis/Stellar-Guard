"use client";

import React, { useState, useEffect } from "react";

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [justReconnected, setJustReconnected] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    function handleOnline() {
      setIsOffline(false);
      setJustReconnected(true);
      const timer = setTimeout(() => setJustReconnected(false), 3500);
      return () => clearTimeout(timer);
    }

    function handleOffline() {
      setIsOffline(true);
      setJustReconnected(false);
    }

    setIsOffline(!navigator.onLine);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (justReconnected) {
    return (
      <div className="bg-emerald-600 text-white text-xs font-semibold py-2 px-4 text-center transition-all animate-in slide-in-from-top duration-200 flex items-center justify-center gap-2">
        <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
        <span>Connection restored. Synchronizing with Stellar network...</span>
      </div>
    );
  }

  if (!isOffline) return null;

  return (
    <div className="bg-rose-600 text-white text-xs font-bold py-2 px-4 text-center transition-all animate-in slide-in-from-top duration-200 flex items-center justify-center gap-2 shadow-md">
      <span className="animate-bounce">⚠️</span>
      <span>
        Network Offline: You are currently disconnected from the internet. Live Soroban streams and multi-sig voting are suspended.
      </span>
    </div>
  );
}
