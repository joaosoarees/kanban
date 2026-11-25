"use client";

import { useEffect } from "react";

const AUTH_PATHS = new Set([
  "/sign-in",
  "/sign-up",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
]);

export function FreshDocument() {
  useEffect(() => {
    const loaded = performance.getEntriesByType("navigation").at(0);
    if (
      loaded !== undefined &&
      !AUTH_PATHS.has(new URL(loaded.name).pathname)
    ) {
      window.location.replace(window.location.href);
    }
  }, []);

  return null;
}
