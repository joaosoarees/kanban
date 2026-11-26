import "server-only";

export function appUrl(path: string): string {
  const base = process.env.APP_URL;
  if (base === undefined || base === "") {
    throw new Error("APP_URL must be set to build links.");
  }
  return new URL(path, base).toString();
}
