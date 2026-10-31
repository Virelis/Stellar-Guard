"use client";

import React, { useState } from "react";

interface BulkAddressImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (addresses: string[]) => void;
}

export function BulkAddressImporterModal({
  isOpen,
  onClose,
  onImport,
}: BulkAddressImporterModalProps) {
  const [textInput, setTextInput] = useState("");
  const [parsedAddresses, setParsedAddresses] = useState<string[]>([]);
  const [invalidLines, setInvalidLines] = useState<number>(0);

  if (!isOpen) return null;

  function handleProcessText(text: string) {
    setTextInput(text);
    const lines = text.split(/[\r\n,;\t]+/);
    const valid: string[] = [];
    let invalid = 0;

    for (const raw of lines) {
      const trimmed = raw.trim().replace(/['"]/g, "");
      if (!trimmed) continue;

      if (trimmed.startsWith("G") && trimmed.length === 56) {
        if (!valid.includes(trimmed)) {
          valid.push(trimmed);
        }
      } else {
        invalid++;
      }
    }

    setParsedAddresses(valid);
    setInvalidLines(invalid);
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) handleProcessText(content);
    };
    reader.readAsText(file);
  }

  function handleConfirm() {
    if (parsedAddresses.length) {
      onImport(parsedAddresses);
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-6 shadow-2xl relative text-slate-100 flex flex-col text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              📂 Bulk Stellar Address Importer
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Upload CSV or paste addresses for batch multi-sig quarantine
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            ✕
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Upload CSV / Text File
            </label>
            <input
              type="file"
              accept=".csv,.txt"
              onChange={handleFileUpload}
              className="w-full text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer text-xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Or Paste Raw Addresses (one per line, or comma-separated)
            </label>
            <textarea
              rows={4}
              value={textInput}
              onChange={(e) => handleProcessText(e.target.value)}
              placeholder="GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN&#10;GBDEVIFVWB277NYUCGDUIWI2XNXOH4AC7WGBNHFQLIN5P5WZ74UHBSVV..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 font-mono text-[11px] text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-slate-400">Valid Addresses: </span>
              <span className="font-bold text-emerald-400 font-mono text-sm">
                {parsedAddresses.length}
              </span>
            </div>
            {invalidLines > 0 && (
              <div>
                <span className="text-slate-400">Invalid / Skipped: </span>
                <span className="font-bold text-amber-400 font-mono">
                  {invalidLines}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!parsedAddresses.length}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white rounded-lg font-semibold transition-all shadow-md shadow-indigo-600/30 disabled:opacity-50"
          >
            Import {parsedAddresses.length} Addresses
          </button>
        </div>
      </div>
    </div>
  );
}

