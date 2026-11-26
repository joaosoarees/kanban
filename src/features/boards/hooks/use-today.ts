"use client";

import { useSyncExternalStore } from "react";
import { localDay } from "@/features/boards/lib/card-due";

function msUntilTomorrow(now: Date) {
  const tomorrow = new Date(now);
  tomorrow.setHours(24, 0, 1, 0);
  return tomorrow.getTime() - now.getTime();
}

const listeners = new Set<() => void>();
let stopClock: (() => void) | null = null;

function notifyListeners() {
  for (const listener of listeners) {
    listener();
  }
}

function startClock() {
  let timer = 0;
  const armMidnight = () => {
    timer = window.setTimeout(() => {
      armMidnight();
      notifyListeners();
    }, msUntilTomorrow(new Date()));
  };

  armMidnight();
  window.addEventListener("focus", notifyListeners);
  document.addEventListener("visibilitychange", notifyListeners);
  return () => {
    window.clearTimeout(timer);
    window.removeEventListener("focus", notifyListeners);
    document.removeEventListener("visibilitychange", notifyListeners);
  };
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  stopClock ??= startClock();
  return () => {
    listeners.delete(onChange);
    if (listeners.size === 0) {
      stopClock?.();
      stopClock = null;
    }
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
