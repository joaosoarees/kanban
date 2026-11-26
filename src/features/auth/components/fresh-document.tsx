"use client";

import { useEffect } from "react";

const AUTH_PATHS = new Set([
  "/sign-in",
  "/sign-up",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
  "/invite",
]);

function isAuthPath(pathname: string) {
  return AUTH_PATHS.has(pathname);
}

export function FreshDocument() {
  useEffect(() => {
    const loaded = performance.getEntriesByType("navigation").at(0);
    if (loaded !== undefined && !isAuthPath(new URL(loaded.name).pathname)) {
      window.location.replace(window.location.href);
    }
  }, []);

  return null;
}
