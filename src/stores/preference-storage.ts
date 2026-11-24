import type { StateStorage } from "zustand/middleware";

const inMemory = new Map<string, string>();

export const preferenceStorage: StateStorage = {
  getItem(name) {
    try {
      return window.localStorage.getItem(name);
    } catch {
      return inMemory.get(name) ?? null;
    }
  },
  setItem(name, value) {
    try {
      window.localStorage.setItem(name, value);
    } catch {
      inMemory.set(name, value);
    }
  },
  removeItem(name) {
    try {
      window.localStorage.removeItem(name);
    } catch {
      inMemory.delete(name);
    }
  },
};
