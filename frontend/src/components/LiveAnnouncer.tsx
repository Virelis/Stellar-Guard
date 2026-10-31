"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface AnnouncerContextType {
  announce: (message: string) => void;
}

const AnnouncerContext = createContext<AnnouncerContextType | undefined>(undefined);

export function LiveAnnouncerProvider({ children }: { children: ReactNode }) {
  const [announcement, setAnnouncement] = useState("");

  function announce(message: string) {
    setAnnouncement(message);
    setTimeout(() => setAnnouncement(""), 3000);
  }

  return (
    <AnnouncerContext.Provider value={{ announce }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        data-testid="live-announcer"
      >
        {announcement}
      </div>
    </AnnouncerContext.Provider>
  );
}

export function useAnnouncer(): AnnouncerContextType {
  const ctx = useContext(AnnouncerContext);
  if (!ctx) {
    return {
      announce: () => {},
    };
  }
  return ctx;
}

