"use client";

import React, { useState } from "react";
import * as StellarSdk from "@stellar/stellar-sdk";

interface XdrInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  xdr: string;
  networkPassphrase?: string;
}

export function XdrInspectorModal({
  isOpen,
  onClose,
  xdr,
  networkPassphrase = StellarSdk.Networks.TESTNET,
}: XdrInspectorModalProps) {
  const [activeTab, setActiveTab] = useState<"decoded" | "raw">("decoded");
  const [copied, setCopied] = useState(false);

  if (!isOpen || !xdr) return null;

  let parsed: any = null;
  let parseError: string | null = null;

  try {
    const tx = StellarSdk.TransactionBuilder.fromXDR(xdr, networkPassphrase);
    parsed = {
      isFeeBump: tx instanceof StellarSdk.FeeBumpTransaction,
      source: tx instanceof StellarSdk.FeeBumpTransaction ? tx.feeSource : tx.source,
      fee: tx.fee,
      memo: tx instanceof StellarSdk.Transaction ? tx.memo.value : undefined,
      sequence: tx instanceof StellarSdk.Transaction ? tx.sequence : undefined,
      operationsCount: tx instanceof StellarSdk.Transaction ? tx.operations.length : 0,
      operations: tx instanceof StellarSdk.Transaction ? tx.operations : [],
      signaturesCount: tx.signatures.length,
    };
  } catch (err: any) {
    parseError = err?.message || "Failed to parse XDR transaction envelope";
  }

  function handleCopy() {
    navigator.clipboard.writeText(xdr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const labUrl = `https://laboratory.stellar.org/#xdr-viewer?input=${encodeURIComponent(
    xdr
  )}&type=TransactionEnvelope&network=test`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full p-6 shadow-2xl relative text-slate-100 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              🔍 Stellar XDR Transaction Inspector
            </h2>
            <p className="text-xs text-slate-400">
              Cryptographically verify transaction envelope before signing
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white rounded-lg p-1.5 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex items-center gap-2 mt-4 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab("decoded")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === "decoded"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Decoded Envelope
          </button>
          <button
            onClick={() => setActiveTab("raw")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === "raw"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Raw Base64 XDR
          </button>
        </div>

        <div className="mt-4 flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
          {parseError ? (
            <div className="bg-rose-500/10 border border-rose-500/40 text-rose-400 p-3 rounded-lg">
              {parseError}
            </div>
          ) : activeTab === "decoded" && parsed ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block mb-1">Source Account</span>
                  <span className="font-mono text-indigo-400 break-all select-all">{parsed.source}</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block mb-1">Fee (Stroops)</span>
                  <span className="font-mono text-white">{parsed.fee} stroops</span>
                </div>
              </div>

              {parsed.sequence && (
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block mb-1">Sequence Number</span>
                  <span className="font-mono text-white">{parsed.sequence}</span>
                </div>
              )}

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block mb-2">
                  Operations ({parsed.operationsCount})
                </span>
                <div className="space-y-2">
                  {parsed.operations.map((op: any, i: number) => (
                    <div key={i} className="bg-slate-900 p-2.5 rounded border border-slate-700/60 font-mono text-[11px]">
                      <span className="text-emerald-400 font-bold block mb-1">
                        #{i + 1} {op.type}
                      </span>
                      <pre className="text-slate-300 text-[10px] overflow-x-auto">
                        {JSON.stringify(op, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Attached Signatures:</span>
                <span className="font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                  {parsed.signaturesCount}
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300 break-all select-all max-h-64 overflow-y-auto">
              {xdr}
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
          <a
            href={labUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-indigo-400 hover:text-indigo-300 underline flex items-center gap-1"
          >
            Open in Stellar Laboratory ↗
          </a>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              {copied ? "Copied!" : "Copy XDR"}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

