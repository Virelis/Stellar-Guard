"use client";

import { useState, useEffect } from "react";

export type Locale = "en" | "es" | "fr" | "de";

const DICTIONARIES: Record<Locale, Record<string, string>> = {
  en: {
    "app.title": "Stellar-Guard",
    "app.subtitle": "CAP-0077 Quorum Freeze Command Center",
    "action.fastFreeze": "Fast Freeze",
    "action.newProposal": "New Proposal",
    "action.connect": "Connect Freighter",
    "status.quorumMet": "Quorum Met",
    "status.pending": "Pending Signatures",
    "tab.overview": "Command Center",
    "tab.analytics": "Analytics & Charts",
    "tab.audit": "Audit Trail",
    "tab.parameters": "Contract Specs",
  },
  es: {
    "app.title": "Stellar-Guard",
    "app.subtitle": "Centro de Comando de Congelación Quórum CAP-0077",
    "action.fastFreeze": "Congelación Rápida",
    "action.newProposal": "Nueva Propuesta",
    "action.connect": "Conectar Billetera",
    "status.quorumMet": "Quórum Alcanzado",
    "status.pending": "Firmas Pendientes",
    "tab.overview": "Centro de Comando",
    "tab.analytics": "Analítica y Gráficos",
    "tab.audit": "Registro de Auditoría",
    "tab.parameters": "Parámetros del Contrato",
  },
  fr: {
    "app.title": "Stellar-Guard",
    "app.subtitle": "Centre de Commande de Gel Quorum CAP-0077",
    "action.fastFreeze": "Gel d'Urgence",
    "action.newProposal": "Nouvelle Proposition",
    "action.connect": "Connecter Portefeuille",
    "status.quorumMet": "Quorum Atteint",
    "status.pending": "Signatures en Attente",
    "tab.overview": "Tableau de Bord",
    "tab.analytics": "Analytique",
    "tab.audit": "Piste d'Audit",
    "tab.parameters": "Spécifications",
  },
  de: {
    "app.title": "Stellar-Guard",
    "app.subtitle": "CAP-0077 Quorum-Freeze Kontrollzentrum",
    "action.fastFreeze": "Sofort-Sperre",
    "action.newProposal": "Neuer Vorschlag",
    "action.connect": "Wallet Verbinden",
    "status.quorumMet": "Quorum Erreicht",
    "status.pending": "Ausstehende Signaturen",
    "tab.overview": "Übersicht",
    "tab.analytics": "Analysen",
    "tab.audit": "Audit-Protokoll",
    "tab.parameters": "Vertragsparameter",
  },
};

const STORAGE_KEY = "stellar_guard_locale";

export function getStoredLocale(): Locale {
  if (typeof window === "undefined") return "en";
  const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
  return stored && DICTIONARIES[stored] ? stored : "en";
}

export function translate(key: string, locale: Locale = "en"): string {
  const dict = DICTIONARIES[locale] || DICTIONARIES.en;
  return dict[key] || DICTIONARIES.en[key] || key;
}

export function useTranslation() {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    setLocaleState(getStoredLocale());
  }, []);

  function setLocale(newLocale: Locale) {
    setLocaleState(newLocale);
    localStorage.setItem(STORAGE_KEY, newLocale);
  }

  function t(key: string): string {
    return translate(key, locale);
  }

  return {
    t,
    locale,
    setLocale,
    availableLocales: (["en", "es", "fr", "de"] as const).map((l) => ({
      code: l,
      name: l === "en" ? "English" : l === "es" ? "Español" : l === "fr" ? "Français" : "Deutsch",
    })),
  };
}
