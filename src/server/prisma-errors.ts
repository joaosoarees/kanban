import "server-only";
import * as z from "zod";

function hasCode(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === code
  );
}

export function isUniqueViolation(error: unknown): boolean {
  return hasCode(error, "P2002");
}

const constraintMeta = z.object({
  driverAdapterError: z.object({
    cause: z.object({ constraint: z.object({ index: z.string() }) }),
  }),
});

function violatedConstraint(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null || !("meta" in error)) {
    return undefined;
  }
  const meta = constraintMeta.safeParse(error.meta);
  return meta.success
    ? meta.data.driverAdapterError.cause.constraint.index
    : undefined;
}

export function isForeignKeyViolation(
  error: unknown,
  constraint: string,
): boolean {
  return hasCode(error, "P2003") && violatedConstraint(error) === constraint;
}
