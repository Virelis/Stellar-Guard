import React from "react";
import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "../context/ThemeContext";
import { InstitutionalFooter } from "../components/InstitutionalFooter";

export const metadata: Metadata = {
  title: "Stellar-Guard | Institutional Freeze Governance & Asset Protection",
  description:
    "Decentralized multi-signature freeze governance and CAP-0077 asset quarantine for regulated RWAs and stablecoins on Stellar.",
  keywords: [
    "Stellar",
    "Soroban",
    "CAP-0077",
    "RWA",
    "Regulated Assets",
    "Multi-Sig",
    "Asset Protection",
    "SEP-0008",
    "SEP-0010",
  ],
  authors: [{ name: "Stellar-Guard Architecture Team" }],
  openGraph: {
    title: "Stellar-Guard | Institutional Freeze Governance & Asset Protection",
    description:
      "Decentralized multi-signature freeze governance and CAP-0077 asset quarantine for regulated RWAs on Stellar.",
    url: "https://stellar-guard.dev",
    siteName: "Stellar-Guard",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Stellar-Guard | CAP-0077 Asset Protection on Stellar",
    description: "Multi-sig quorum freeze governance for regulated assets on Stellar.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('stellar_guard_theme')||localStorage.getItem('theme');if(t!=='light')document.documentElement.classList.add('dark')})()`,
          }}
        />
      </head>
      <body className="bg-white dark:bg-stellar-dark text-gray-900 dark:text-white min-h-screen flex flex-col justify-between">
        <ThemeProvider>
          <div className="flex-1">{children}</div>
          <InstitutionalFooter />
        </ThemeProvider>
      </body>
    </html>
  );
}
