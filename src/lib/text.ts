const NUL = String.fromCodePoint(0);
const BLANK = /^[\s\p{Default_Ignorable_Code_Point}]*$/u;

export const INVALID_CHARACTER = "Remova os caracteres inválidos.";

export function hasVisibleText(text: string) {
  return !BLANK.test(text);
}

export function hasNoNul(text: string) {
  return !text.includes(NUL);
}
