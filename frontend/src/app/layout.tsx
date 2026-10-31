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
    // Always start in dark mode — user can toggle via ThemeToggle
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* Preconnect to Google Fonts for faster load */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        {/* Theme persistence — apply saved preference, default to dark */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
              try {
                var t = localStorage.getItem('stellar_guard_theme') || localStorage.getItem('theme');
                if (t === 'light') {
                  document.documentElement.classList.remove('dark');
                } else {
                  document.documentElement.classList.add('dark');
                }
              } catch(e) {
                document.documentElement.classList.add('dark');
              }
            })()`,
          }}
        />
      </head>
      <body
        className="
          bg-stellar-dark text-stellar-surface
          dark:bg-[#020817] dark:text-slate-100
          min-h-screen flex flex-col justify-between
          font-sans antialiased
          selection:bg-indigo-500/30 selection:text-white
        "
      >
        <ThemeProvider>
          <div className="flex-1 relative">{children}</div>
          <InstitutionalFooter />
        </ThemeProvider>
      </body>
    </html>
  );
}
