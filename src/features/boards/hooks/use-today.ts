"use client";

import { useSyncExternalStore } from "react";
import { localDay } from "@/features/boards/lib/card-due";

function msUntilTomorrow(now: Date) {
  const tomorrow = new Date(now);
  tomorrow.setHours(24, 0, 1, 0);
  return tomorrow.getTime() - now.getTime();
}

function subscribe(onChange: () => void) {
  let timer = 0;
  const armMidnight = () => {
    timer = window.setTimeout(() => {
      onChange();
      armMidnight();
    }, msUntilTomorrow(new Date()));
  };

  armMidnight();
  window.addEventListener("focus", onChange);
  document.addEventListener("visibilitychange", onChange);
  return () => {
    window.clearTimeout(timer);
    window.removeEventListener("focus", onChange);
    document.removeEventListener("visibilitychange", onChange);
  };
}

function getSnapshot() {
  return localDay(new Date());
}

function getServerSnapshot() {
  return null;
}

export function useToday(): string | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
