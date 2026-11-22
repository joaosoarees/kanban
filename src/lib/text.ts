const NUL = String.fromCodePoint(0);

export const INVALID_CHARACTER = "Remova os caracteres inválidos.";

export function hasNoNul(text: string) {
  return !text.includes(NUL);
}
