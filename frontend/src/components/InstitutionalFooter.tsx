"use client";

import React from "react";
import { Sep1DomainBadge } from "./Sep1DomainBadge";

export function InstitutionalFooter() {
  return (
    <footer className="mt-16 border-t border-slate-800 bg-slate-950/80 text-xs text-slate-400 py-8 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <span className="font-bold text-white">Stellar-Guard</span>
            <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded font-mono">
              v1.0.0
            </span>
            <Sep1DomainBadge />
          </div>
          <p className="text-[11px] text-slate-500 max-w-md">
            Decentralized multi-signature asset quarantine and RWA compliance governance infrastructure for the Stellar network.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 text-[11px]">
          <a
            href="https://github.com/stellar/stellar-protocol/blob/master/core/cap-0077.md"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-indigo-400 transition-colors"
          >
            CAP-0077 Spec ↗
          </a>
          <a
            href="https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0008.md"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-indigo-400 transition-colors"
          >
            SEP-0008 RWA ↗
          </a>
          <a
            href="https://soroban.stellar.org/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-indigo-400 transition-colors"
          >
            Soroban Docs ↗
          </a>
          <a
            href="https://stellar.expert"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-indigo-400 transition-colors"
          >
            Stellar Expert ↗
          </a>
          <a
            href="https://github.com/Virelis/Stellar-Guard"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-indigo-400 transition-colors"
          >
            GitHub Repo ↗
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-6 pt-4 border-t border-slate-900 text-center text-[10px] text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>© {new Date().getFullYear()} Stellar-Guard Open Source Initiative. MIT Licensed.</span>
        <span>Cryptographically secured on Soroban Smart Contracts</span>
      </div>
    </footer>
  );
}

