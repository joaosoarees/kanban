export function firstCharacter(text: string): string {
  return (Array.from(text.trim())[0] ?? "").toUpperCase();
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/u);
  const first = firstCharacter(parts[0] ?? "");
  const last = parts.length > 1 ? firstCharacter(parts.at(-1) ?? "") : "";
  return first + last;
}
