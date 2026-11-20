const SLUG_MAX_LENGTH = 48;
const SUFFIX_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

export function slugify(text: string): string {
  const slug = text
    .normalize("NFD")
    .replaceAll(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/gu, "-")
    .replaceAll(/^-+|-+$/gu, "");

  return cutAtLastWord(slug) || "workspace";
}

function cutAtLastWord(slug: string): string {
  if (slug.length <= SLUG_MAX_LENGTH) {
    return slug;
  }

  const head = slug.slice(0, SLUG_MAX_LENGTH + 1);
  const lastHyphen = head.lastIndexOf("-");
  const cut =
    lastHyphen >= SLUG_MAX_LENGTH / 2
      ? head.slice(0, lastHyphen)
      : head.slice(0, SLUG_MAX_LENGTH);

  return cut.replace(/-+$/u, "");
}

export function withRandomSuffix(slug: string): string {
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  const suffix = Array.from(
    bytes,
    (byte) => SUFFIX_ALPHABET[byte % SUFFIX_ALPHABET.length],
  ).join("");

  return `${slug}-${suffix}`;
}
