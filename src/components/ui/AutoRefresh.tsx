"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface AutoRefreshProps {
  intervalMs?: number;
  showIndicator?: boolean;
}

const FOCUS_COOLDOWN_MS = 5000;

export function AutoRefresh({
  intervalMs = 20000,
  showIndicator = false,
}: AutoRefreshProps) {
  const router = useRouter();
  const [lastRefreshed, setLastRefreshed] = useState<string>("");
  const lastTriggerAtRef = useRef<number>(0);

  const triggerRefresh = useCallback(
    (force = false) => {
      const nowMs = Date.now();
      if (!force && nowMs - lastTriggerAtRef.current < FOCUS_COOLDOWN_MS) {
        return;
      }
      lastTriggerAtRef.current = nowMs;
      router.refresh();
      setLastRefreshed(
        new Date(nowMs).toLocaleTimeString("id-ID", {
          timeZone: "Asia/Jakarta",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    },
    [router]
  );

  useEffect(() => {
    const onFocus = () => {
      if (document.visibilityState === "visible") {
        triggerRefresh(false);
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        triggerRefresh(false);
      }
    };

    const timer = setInterval(() => {
      if (document.visibilityState === "visible") {
        triggerRefresh(true);
      }
    }, intervalMs);

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [triggerRefresh, intervalMs]);

  if (!showIndicator) return null;

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium text-[#5C5E66] bg-[#FFFFFF] border border-[#E2DED3]">
      <span className="relative flex h-1.5 w-1.5 items-center justify-center">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-600" />
      </span>
      <span>Live sync ({Math.round(intervalMs / 1000)}d)</span>
      {lastRefreshed && (
        <span className="text-[#787A82] border-l border-[#E2DED3] pl-1.5 tabular-nums">
          {lastRefreshed}
        </span>
      )}
    </div>
  );
}
