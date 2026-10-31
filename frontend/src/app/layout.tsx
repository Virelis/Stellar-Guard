import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "../context/ThemeContext";
import { InstitutionalFooter } from "../components/InstitutionalFooter";

export const metadata: Metadata = {
  title: "Stellar-Guard | CAP-0077 Command Center",
  description: "UI-driven interface for Quorum Freeze — quarantine compromised RWA assets",
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
          <div className="flex-1">
            {children}
          </div>
          <InstitutionalFooter />
        </ThemeProvider>
      </body>
    </html>
  );
}
