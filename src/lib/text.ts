const NUL = String.fromCodePoint(0);
const BLANK =
  /^[\s\p{Cc}\p{Cf}\p{Default_Ignorable_Code_Point}\u2800\u{1D159}]*$/u;
const LINE_BREAK = /[\n\v\f\r\u0085\u2028\u2029]/u;

export const INVALID_CHARACTER = "Remova os caracteres inválidos.";

export function hasVisibleText(text: string) {
  return !BLANK.test(text);
}

export function hasNoNul(text: string) {
  return !text.includes(NUL);
}

export function hasNoLineBreak(text: string) {
  return !LINE_BREAK.test(text);
}

export function codePointLength(text: string) {
  return Array.from(text).length;
}
