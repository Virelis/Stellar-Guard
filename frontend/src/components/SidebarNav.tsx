"use client";

import React from "react";

interface SidebarNavProps {
  collapsed: boolean;
  onToggle: () => void;
  activeItem: string;
  onSelectItem: (item: string) => void;
}

const NAV_ITEMS = [
  { id: "overview",    label: "Command Center",   icon: "⚡", accent: "#818cf8" },
  { id: "proposals",  label: "Freeze Proposals",  icon: "⚖️",  accent: "#a78bfa" },
  { id: "analytics",  label: "Telemetry & Charts", icon: "📈", accent: "#22d3ee" },
  { id: "audit",      label: "Audit Trail",        icon: "📜", accent: "#818cf8" },
  { id: "parameters", label: "Contract Specs",     icon: "⚙️",  accent: "#a78bfa" },
] as const;

export function SidebarNav({
  collapsed,
  onToggle,
  activeItem,
  onSelectItem,
}: SidebarNavProps) {
  return (
    <aside
      className="flex flex-col justify-between transition-all duration-300 select-none"
      style={{
        width: collapsed ? "64px" : "224px",
        background: "rgba(5,10,20,0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderRight: "1px solid rgba(30,45,69,0.9)",
        boxShadow: "4px 0 24px rgba(0,0,0,0.3)",
      }}
    >
      {/* ── Top section ─────────────────────────────────────── */}
      <div className="p-3">
        {/* Header row */}
        <div
          className="flex items-center justify-between pb-3 mb-3"
          style={{ borderBottom: "1px solid rgba(30,45,69,0.9)" }}
        >
          {!collapsed && (
            <span
              className="text-[10px] font-bold tracking-widest uppercase"
              style={{ color: "#4a5568" }}
            >
              Navigation
            </span>
          )}
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg transition-all duration-200"
            style={{ color: "#4a5568", marginLeft: collapsed ? "auto" : undefined, marginRight: collapsed ? "auto" : undefined }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "#818cf8";
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(99,102,241,0.1)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "#4a5568";
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            }}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <span className="text-sm font-bold">{collapsed ? "»" : "«"}</span>
          </button>
        </div>

        {/* Nav items */}
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = activeItem === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectItem(item.id)}
                className="w-full flex items-center rounded-xl text-xs font-semibold transition-all duration-200 group"
                style={{
                  padding: collapsed ? "10px" : "10px 12px",
                  justifyContent: collapsed ? "center" : "flex-start",
                  gap: collapsed ? undefined : "10px",
                  background: isActive
                    ? "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15))"
                    : "transparent",
                  border: isActive
                    ? "1px solid rgba(99,102,241,0.3)"
                    : "1px solid transparent",
                  color: isActive ? "#c7d2fe" : "#4a5568",
                  boxShadow: isActive
                    ? "0 0 12px rgba(99,102,241,0.1), inset 0 1px 0 rgba(255,255,255,0.04)"
                    : "none",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(99,102,241,0.07)";
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(99,102,241,0.15)";
                    (e.currentTarget as HTMLButtonElement).style.color = "#94a3b8";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "transparent";
                    (e.currentTarget as HTMLButtonElement).style.color = "#4a5568";
                  }
                }}
                title={collapsed ? item.label : undefined}
              >
                {/* Icon container */}
                <span
                  className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-all duration-200"
                  style={{
                    background: isActive
                      ? "linear-gradient(135deg, rgba(99,102,241,0.4), rgba(139,92,246,0.3))"
                      : "rgba(15,23,42,0.6)",
                    border: isActive
                      ? "1px solid rgba(99,102,241,0.4)"
                      : "1px solid rgba(30,45,69,0.8)",
                    boxShadow: isActive ? "0 0 8px rgba(99,102,241,0.3)" : "none",
                  }}
                >
                  {item.icon}
                </span>

                {!collapsed && (
                  <span className="truncate tracking-wide">{item.label}</span>
                )}

                {/* Active indicator dot on right */}
                {!collapsed && isActive && (
                  <span
                    className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: "#818cf8",
                      boxShadow: "0 0 6px rgba(129,140,248,0.8)",
                    }}
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ── Bottom status ────────────────────────────────────── */}
      <div
        className="p-3 m-2 rounded-xl"
        style={{
          background: "rgba(10,15,30,0.6)",
          border: "1px solid rgba(30,45,69,0.8)",
        }}
      >
        {!collapsed ? (
          <div className="flex items-center justify-between">
            <div>
              <div
                className="text-[9px] font-bold uppercase tracking-widest"
                style={{ color: "#4a5568" }}
              >
                Protocol
              </div>
              <div
                className="text-[11px] font-mono font-bold mt-0.5"
                style={{ color: "#818cf8" }}
              >
                CAP-0077 v1.0
              </div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  backgroundColor: "#22c55e",
                  boxShadow: "0 0 6px rgba(34,197,94,0.9), 0 0 12px rgba(34,197,94,0.5)",
                  animation: "status-blink 2s ease-in-out infinite",
                }}
              />
              <span
                className="text-[8px] font-bold uppercase tracking-widest"
                style={{ color: "#22c55e" }}
              >
                Live
              </span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{
                backgroundColor: "#22c55e",
                boxShadow: "0 0 6px rgba(34,197,94,0.9), 0 0 12px rgba(34,197,94,0.5)",
                animation: "status-blink 2s ease-in-out infinite",
              }}
            />
          </div>
        )}
      </div>
    </aside>
  );
}
