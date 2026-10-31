"use client";

import React, { useState } from "react";

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: string;
  title?: string;
  subtitle?: string;
}

export function QrCodeModal({
  isOpen,
  onClose,
  data,
  title = "Mobile Wallet QR Code",
  subtitle = "Scan with your mobile Stellar wallet to sign or inspect",
}: QrCodeModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !data) return null;

  // Use encoded SVG / Google Chart API / QR Server fallback for instant standard rendering
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    data
  )}&margin=10`;

  function handleCopy() {
    navigator.clipboard.writeText(data);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-sm w-full p-6 shadow-2xl relative text-slate-100 flex flex-col items-center text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white rounded-lg p-1.5 transition-colors"
          aria-label="Close modal"
        >
          ✕
        </button>

        <h3 className="text-base font-bold text-white mt-1">{title}</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">{subtitle}</p>

        <div className="mt-4 p-3 bg-white rounded-xl shadow-inner border border-slate-300">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrUrl}
            alt="Stellar QR Code"
            width={240}
            height={240}
            className="rounded"
          />
        </div>

        <div className="mt-4 w-full bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300 break-all select-all max-h-20 overflow-y-auto">
          {data}
        </div>

        <div className="mt-4 flex items-center gap-2 w-full">
          <button
            onClick={handleCopy}
            className="flex-1 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700"
          >
            {copied ? "Copied!" : "Copy Payload"}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

