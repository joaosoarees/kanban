"use client";

import { useSyncExternalStore } from "react";

const PHONE_QUERY = "(max-width: 39.99rem)";

function subscribe(onStoreChange: () => void) {
  const phone = window.matchMedia(PHONE_QUERY);
  phone.addEventListener("change", onStoreChange);
  return () => {
    phone.removeEventListener("change", onStoreChange);
  };
}

export function useIsPhone() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(PHONE_QUERY).matches,
    () => false,
  );
}
