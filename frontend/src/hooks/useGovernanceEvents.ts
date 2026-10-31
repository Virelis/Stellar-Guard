"use client";

import { useState, useEffect, useCallback } from "react";

const API = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000";

export interface GovernanceLiveEvent {
  id?: string;
  type: string;
  data: any;
  timestamp: number;
}

export type SseConnectionStatus = "connecting" | "connected" | "disconnected";

export function useGovernanceEvents(onEvent?: (event: GovernanceLiveEvent) => void) {
  const [events, setEvents] = useState<GovernanceLiveEvent[]>([]);
  const [status, setStatus] = useState<SseConnectionStatus>("disconnected");
  const [lastEvent, setLastEvent] = useState<GovernanceLiveEvent | null>(null);

  const handleMessage = useCallback(
    (ev: MessageEvent) => {
      try {
        const parsed = JSON.parse(ev.data);
        const liveEvent: GovernanceLiveEvent = {
          type: parsed.type || "unknown",
          data: parsed.data || parsed,
          timestamp: Date.now(),
        };

        setLastEvent(liveEvent);
        setEvents((prev) => [liveEvent, ...prev.slice(0, 49)]); // keep last 50
        if (onEvent) onEvent(liveEvent);
      } catch {
        // non-fatal json parse
      }
    },
    [onEvent]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    let eventSource: EventSource | null = null;
    let reconnectTimer: NodeJS.Timeout | null = null;

    function connect() {
      setStatus("connecting");
      try {
        eventSource = new EventSource(`${API}/api/events`);

        eventSource.onopen = () => {
          setStatus("connected");
        };

        eventSource.onmessage = handleMessage;

        eventSource.onerror = () => {
          setStatus("disconnected");
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          reconnectTimer = setTimeout(connect, 5000);
        };
      } catch {
        setStatus("disconnected");
        reconnectTimer = setTimeout(connect, 5000);
      }
    }

    connect();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
    };
  }, [handleMessage]);

  return { events, status, lastEvent };
}

