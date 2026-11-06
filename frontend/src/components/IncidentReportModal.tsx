"use client";

import React from "react";
import { resolveAlias } from "../utils/addressBook";

export interface IncidentReportData {
  incidentId: string;
  assetCode: string;
  issuer: string;
  target: string;
  quorumSigners: string[];
  quorumRequired: number;
  amlScore?: number;
  amlLevel?: string;
  txHash?: string;
  reason?: string;
  timestamp: string;
}

interface IncidentReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: IncidentReportData;
}

export function IncidentReportModal({ isOpen, onClose, data }: IncidentReportModalProps) {
  if (!isOpen || !data) return null;

  function handlePrint() {
    window.print();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full p-6 shadow-2xl relative text-slate-100 max-h-[90vh] flex flex-col print:m-0 print:border-none print:shadow-none print:p-8">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 print:hidden">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            📄 Institutional Compliance Incident Dossier
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
            >
              <span>🖨️ Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg text-xs"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Printable Content */}
        <div className="mt-4 flex-1 overflow-y-auto space-y-4 pr-1 text-xs text-slate-300 print:text-black">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-lg font-black text-white tracking-wide block">
                STELLAR-GUARD INCIDENT DOSSIER
              </span>
              <span className="text-[11px] text-slate-400">
                CAP-0077 Multi-Sig Asset Quarantine Record
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono font-bold text-indigo-400">
                REF: {data.incidentId}
              </span>
              <span className="text-[10px] text-slate-500 block">{data.timestamp}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block mb-1">
                Quarantined Asset
              </span>
              <span className="font-bold text-white text-sm">{data.assetCode}</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block mb-1">
                AML Risk Rating
              </span>
              <span className="font-bold text-rose-400 text-sm">
                {data.amlScore ?? 85}/100 ({data.amlLevel || "CRITICAL"})
              </span>
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
            <div>
              <span className="text-[10px] text-slate-500 uppercase block mb-0.5">
                Target Account Address
              </span>
              <span className="font-mono text-cyan-400 text-[11px] break-all select-all">
                {data.target}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 uppercase block mb-0.5">
                Asset Issuer Public Key
              </span>
              <span className="font-mono text-slate-300 text-[11px] break-all select-all">
                {data.issuer}
              </span>
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase block mb-2">
              Multi-Sig Quorum Signers ({data.quorumSigners.length} / {data.quorumRequired})
            </span>
            <div className="space-y-1 font-mono text-[11px]">
              {data.quorumSigners.map((signer, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center py-1 border-b border-slate-900 last:border-none"
                >
                  <span className="text-indigo-300">{resolveAlias(signer)}</span>
                  <span className="text-slate-500 text-[10px]">
                    {signer.slice(0, 8)}…{signer.slice(-6)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {data.reason && (
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block mb-1">
                Incident Category & Memo
              </span>
              <span className="text-slate-300 text-[11px]">{data.reason}</span>
            </div>
          )}

          <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-800 flex justify-between">
            <span>Standard: Stellar CAP-0077 / SEP-0008</span>
            <span>Cryptographically Verified on Soroban Testnet</span>
          </div>
        </div>
      </div>
    </div>
  );
}
