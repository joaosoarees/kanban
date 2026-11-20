const SLUG_MAX_LENGTH = 48;
const SUFFIX_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

export function slugify(text: string): string {
  const slug = text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, SLUG_MAX_LENGTH)
    .replace(/^-+|-+$/g, "");

  return slug || "workspace";
}

export function withRandomSuffix(slug: string): string {
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  const suffix = Array.from(
    bytes,
    (byte) => SUFFIX_ALPHABET[byte % SUFFIX_ALPHABET.length],
  ).join("");

  return `${slug}-${suffix}`;
}
