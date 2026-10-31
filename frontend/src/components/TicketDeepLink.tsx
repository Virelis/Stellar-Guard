"use client";

import React from "react";

export type TicketProvider = "linear" | "jira" | "github" | "generic";

interface TicketDeepLinkProps {
  referenceId: string;
  provider?: TicketProvider;
  jiraBaseUrl?: string;
}

export function buildTicketUrl(
  referenceId: string,
  provider: TicketProvider = "linear",
  jiraBaseUrl: string = "https://jira.example.com"
): string {
  const cleanId = referenceId.trim();
  switch (provider) {
    case "linear":
      return `https://linear.app/issue/${cleanId}`;
    case "jira":
      return `${jiraBaseUrl}/browse/${cleanId}`;
    case "github":
      return `https://github.com/Virelis/Stellar-Guard/issues?q=${encodeURIComponent(cleanId)}`;
    default:
      return `#${cleanId}`;
  }
}

export function TicketDeepLink({
  referenceId,
  provider = "linear",
  jiraBaseUrl,
}: TicketDeepLinkProps) {
  if (!referenceId) return null;

  const url = buildTicketUrl(referenceId, provider, jiraBaseUrl);

  const icon = provider === "linear" ? "🔷" : provider === "jira" ? "🟦" : "🐙";

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white px-2 py-0.5 rounded text-[11px] font-mono border border-slate-700 transition-colors"
      title={`Open ${referenceId} in ${provider.toUpperCase()}`}
    >
      <span>{icon}</span>
      <span>{referenceId}</span>
      <span className="text-[9px] opacity-60">↗</span>
    </a>
  );
}
