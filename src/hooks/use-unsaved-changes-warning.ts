import { useEffect } from "react";

export function useUnsavedChangesWarning(hasUnsavedChanges: boolean) {
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    if (hasUnsavedChanges) {
      window.addEventListener("beforeunload", warn);
    }
    return () => {
      window.removeEventListener("beforeunload", warn);
    };
  }, [hasUnsavedChanges]);
}
