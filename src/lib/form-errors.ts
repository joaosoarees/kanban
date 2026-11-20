import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import type { ActionResult } from "@/lib/action-result";

export function applyActionErrors<T extends FieldValues>(
  result: Extract<ActionResult, { status: "error" }>,
  setError: UseFormSetError<T>,
) {
  const fieldErrors = Object.entries(result.fieldErrors ?? {});

  for (const [field, messages] of fieldErrors) {
    const message = messages?.at(0);
    if (message !== undefined) {
      setError(field as Path<T>, { message });
    }
  }

  if (fieldErrors.length === 0) {
    setError("root", { message: result.message });
  }
}
