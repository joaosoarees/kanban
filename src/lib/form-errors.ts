import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import type { ActionResult } from "@/lib/action-result";

export function applyActionErrors<T extends FieldValues>(
  result: Extract<ActionResult, { status: "error" }>,
  setError: UseFormSetError<T>,
) {
  const fieldErrors = Object.entries(result.fieldErrors ?? {});

  for (const [field, messages] of fieldErrors) {
    if (messages?.[0]) {
      setError(field as Path<T>, { message: messages[0] });
    }
  }

  if (fieldErrors.length === 0) {
    setError("root", { message: result.message });
  }
}
