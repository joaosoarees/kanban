"use client";

import { useSyncExternalStore } from "react";
import { localDay } from "@/features/boards/lib/card-due";

function subscribe(onChange: () => void) {
  window.addEventListener("focus", onChange);
  document.addEventListener("visibilitychange", onChange);
  return () => {
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
