"use client";

import React from "react";

export type ExplorerEntityType = "account" | "tx" | "contract" | "asset";

interface StellarExplorerLinkProps {
  type: ExplorerEntityType;
  value: string;
  assetIssuer?: string;
  network?: string;
  label?: string;
  className?: string;
}

export function buildStellarExpertUrl(
  type: ExplorerEntityType,
  value: string,
  assetIssuer?: string,
  network: string = "testnet"
): string {
  const net = network.toLowerCase() === "public" || network.toLowerCase() === "mainnet" ? "public" : "testnet";
  const baseUrl = `https://stellar.expert/explorer/${net}`;

  switch (type) {
    case "account":
      return `${baseUrl}/account/${value}`;
    case "tx":
      return `${baseUrl}/tx/${value}`;
    case "contract":
      return `${baseUrl}/contract/${value}`;
    case "asset":
      return assetIssuer ? `${baseUrl}/asset/${value}-${assetIssuer}` : `${baseUrl}/asset/${value}`;
    default:
      return baseUrl;
  }
}

export function StellarExplorerLink({
  type,
  value,
  assetIssuer,
  network = "testnet",
  label,
  className = "",
}: StellarExplorerLinkProps) {
  const url = buildStellarExpertUrl(type, value, assetIssuer, network);
  const displayLabel = label || (value.length > 16 ? `${value.slice(0, 6)}…${value.slice(-4)}` : value);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 hover:underline transition-colors ${className}`}
      title={`View on Stellar Expert Explorer (${network})`}
    >
      <span>{displayLabel}</span>
      <span className="text-[10px] opacity-70">↗</span>
    </a>
  );
}

