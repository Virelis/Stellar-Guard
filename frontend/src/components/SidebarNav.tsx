"use client";

import React from "react";

interface SidebarNavProps {
  collapsed: boolean;
  onToggle: () => void;
  activeItem: string;
  onSelectItem: (item: string) => void;
}

export function SidebarNav({
  collapsed,
  onToggle,
  activeItem,
  onSelectItem,
}: SidebarNavProps) {
  const items = [
    { id: "overview", label: "Command Center", icon: "🛡️" },
    { id: "proposals", label: "Freeze Proposals", icon: "⚖️" },
    { id: "analytics", label: "Telemetry & Charts", icon: "📈" },
    { id: "audit", label: "Audit Trail", icon: "📜" },
    { id: "parameters", label: "Contract Specs", icon: "⚙️" },
  ];

  return (
    <aside
      className={`bg-slate-900 border-r border-slate-800 transition-all duration-300 flex flex-col justify-between p-3 select-none ${
        collapsed ? "w-16" : "w-56"
      }`}
    >
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          {!collapsed && (
            <span className="font-extrabold text-white text-xs tracking-wider uppercase">
              Navigation
            </span>
          )}
          <button
            onClick={onToggle}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors mx-auto"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? "»" : "«"}
          </button>
        </div>

        <nav className="mt-4 space-y-1">
          {items.map((item) => {
            const isActive = activeItem === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectItem(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
                title={collapsed ? item.label : undefined}
              >
                <span className="text-base">{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="pt-3 border-t border-slate-800 text-center">
        {!collapsed ? (
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>CAP-0077 v1.0</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
        ) : (
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
        )}
      </div>
    </aside>
  );
}

