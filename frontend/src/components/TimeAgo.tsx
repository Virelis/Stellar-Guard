"use client";

import React, { useState, useEffect } from "react";
import { formatRelativeTime, formatDateTime } from "../utils/dateFormatter";

interface TimeAgoProps {
  timestamp: number;
  className?: string;
}

export function TimeAgo({ timestamp, className = "" }: TimeAgoProps) {
  const [relative, setRelative] = useState(formatRelativeTime(timestamp));

  useEffect(() => {
    setRelative(formatRelativeTime(timestamp));
    const interval = setInterval(() => {
      setRelative(formatRelativeTime(timestamp));
    }, 15000); // refresh every 15s

    return () => clearInterval(interval);
  }, [timestamp]);

  const fullDate = formatDateTime(timestamp);

  return (
    <time dateTime={new Date(timestamp > 1e11 ? timestamp : timestamp * 1000).toISOString()} title={fullDate} className={`cursor-help ${className}`}>
      {relative}
    </time>
  );
}
