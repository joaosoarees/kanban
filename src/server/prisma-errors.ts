import "server-only";

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

export function isForeignKeyViolation(error: unknown): boolean {
  return hasCode(error, "P2003");
}
