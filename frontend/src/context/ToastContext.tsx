"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  actionLabel?: string;
  actionUrl?: string;
}

interface ToastContextType {
  showToast: (toast: Omit<ToastItem, "id">) => void;
  success: (title: string, message?: string, actionUrl?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  function removeToast(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  function showToast(toast: Omit<ToastItem, "id">) {
    const id = Math.random().toString(36).slice(2, 9);
    const item: ToastItem = { ...toast, id };
    setToasts((prev) => [...prev, item]);

    setTimeout(() => {
      removeToast(id);
    }, 5000);
  }

  const success = (title: string, message?: string, actionUrl?: string) =>
    showToast({
      type: "success",
      title,
      message,
      actionUrl,
      actionLabel: actionUrl ? "View ↗" : undefined,
    });

  const error = (title: string, message?: string) => showToast({ type: "error", title, message });

  const warning = (title: string, message?: string) =>
    showToast({ type: "warning", title, message });

  const info = (title: string, message?: string) => showToast({ type: "info", title, message });

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => {
          const borderClass =
            t.type === "success"
              ? "border-emerald-500/40 bg-slate-900/95 text-emerald-400"
              : t.type === "error"
                ? "border-rose-500/40 bg-slate-900/95 text-rose-400"
                : t.type === "warning"
                  ? "border-amber-500/40 bg-slate-900/95 text-amber-400"
                  : "border-indigo-500/40 bg-slate-900/95 text-indigo-400";

          return (
            <div
              key={t.id}
              className={`pointer-events-auto p-3 rounded-xl border shadow-2xl backdrop-blur-md flex items-start justify-between gap-3 animate-in slide-in-from-bottom-2 duration-150 ${borderClass}`}
              role="alert"
            >
              <div className="space-y-0.5 text-xs flex-1">
                <span className="font-bold text-white block">{t.title}</span>
                {t.message && <p className="text-slate-300 text-[11px]">{t.message}</p>}
                {t.actionUrl && (
                  <a
                    href={t.actionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-1 text-[11px] text-indigo-400 hover:underline font-bold"
                  >
                    {t.actionLabel || "View Details ↗"}
                  </a>
                )}
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-slate-500 hover:text-white p-1 text-xs"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextType {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      showToast: () => {},
      success: () => {},
      error: () => {},
      warning: () => {},
      info: () => {},
    };
  }
  return ctx;
}
