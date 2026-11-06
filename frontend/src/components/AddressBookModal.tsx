"use client";

import React, { useState, useEffect } from "react";
import { getAddressBook, saveContact, deleteContact, ContactEntry } from "../utils/addressBook";

interface AddressBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAddress?: (address: string) => void;
}

export function AddressBookModal({ isOpen, onClose, onSelectAddress }: AddressBookModalProps) {
  const [contacts, setContacts] = useState<ContactEntry[]>([]);
  const [newAlias, setNewAlias] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newRole, setNewRole] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setContacts(getAddressBook());
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const addr = newAddress.trim();
    if (!addr.startsWith("G") || addr.length !== 56) {
      setError("Address must be a valid 56-character Stellar public key starting with 'G'");
      return;
    }

    if (!newAlias.trim()) {
      setError("Alias name is required");
      return;
    }

    const contact: ContactEntry = {
      address: addr,
      alias: newAlias.trim(),
      role: newRole.trim() || undefined,
    };

    saveContact(contact);
    setContacts(getAddressBook());
    setNewAddress("");
    setNewAlias("");
    setNewRole("");
  }

  function handleDelete(address: string) {
    deleteContact(address);
    setContacts(getAddressBook());
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-xl w-full p-6 shadow-2xl relative text-slate-100 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              📖 Compliance Admin Address Book
            </h2>
            <p className="text-xs text-slate-400">
              Manage trusted governance keys and institutional aliases
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white rounded-lg p-1.5 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Contact List */}
        <div className="mt-4 flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
          {contacts.map((c) => (
            <div
              key={c.address}
              className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-colors"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{c.alias}</span>
                  {c.role && (
                    <span className="bg-indigo-500/20 text-indigo-400 text-[10px] px-1.5 py-0.5 rounded border border-indigo-500/30 font-semibold">
                      {c.role}
                    </span>
                  )}
                </div>
                <span className="font-mono text-[11px] text-slate-400 block select-all">
                  {c.address}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {onSelectAddress && (
                  <button
                    onClick={() => {
                      onSelectAddress(c.address);
                      onClose();
                    }}
                    className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[11px] font-semibold"
                  >
                    Select
                  </button>
                )}
                <button
                  onClick={() => handleDelete(c.address)}
                  className="p-1 text-slate-500 hover:text-rose-400 rounded"
                  title="Remove alias"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add Contact Form */}
        <form onSubmit={handleAdd} className="mt-4 pt-4 border-t border-slate-800 space-y-3">
          <span className="text-xs font-semibold text-slate-300 block">
            Add Trusted Admin / Alias
          </span>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Alias (e.g. Alice Security Lead)"
              value={newAlias}
              onChange={(e) => setNewAlias(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              required
            />
            <input
              type="text"
              placeholder="Role (e.g. Admin 1 / Signer)"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <input
            type="text"
            placeholder="Stellar Public Key (G...)"
            value={newAddress}
            onChange={(e) => setNewAddress(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
            required
          />

          {error && (
            <div className="text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded p-2 text-[11px]">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="submit"
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
            >
              Save Alias
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
