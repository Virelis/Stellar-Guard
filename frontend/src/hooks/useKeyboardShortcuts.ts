"use client";

import { useEffect } from "react";

interface ShortcutMap {
  [key: string]: () => void;
}

export function useKeyboardShortcuts(shortcuts: ShortcutMap, onOpenPalette?: () => void) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      if (isCmdOrCtrl && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (onOpenPalette) onOpenPalette();
        return;
      }

      // Check simple custom shortcuts
      const keyCombo = `${isCmdOrCtrl ? "ctrl+" : ""}${e.key.toLowerCase()}`;
      if (shortcuts[keyCombo]) {
        e.preventDefault();
        shortcuts[keyCombo]();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts, onOpenPalette]);
}

