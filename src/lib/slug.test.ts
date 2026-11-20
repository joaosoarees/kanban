import { describe, expect, it } from "vitest";
import { slugify } from "./slug";

describe("slugify", () => {
  it("lowercases, strips accents and joins words with hyphens", () => {
    expect(slugify("  Time de Produto & Operações  ")).toBe(
      "time-de-produto-operacoes",
    );
  });

  it("keeps names up to 48 characters whole", () => {
    const name = "a".repeat(48);
    expect(slugify(name)).toBe(name);
  });

  it("cuts long names at the last hyphen before 48 characters", () => {
    expect(
      slugify("Freela Ateliê Rocha com um nome bem comprido para testar"),
    ).toBe("freela-atelie-rocha-com-um-nome-bem-comprido");
  });

  it("keeps a word that ends exactly at the limit", () => {
    const name = `${"a".repeat(43)} bbbb cc`;
    expect(slugify(name)).toBe(`${"a".repeat(43)}-bbbb`);
  });

  it("cuts a single long word at 48 characters", () => {
    expect(slugify("x".repeat(60))).toBe("x".repeat(48));
  });

  it("cuts at 48 characters when the last whole word would be too short", () => {
    const name = `A ${"b".repeat(60)}`;
    expect(slugify(name)).toBe(`a-${"b".repeat(46)}`);
  });

  it("falls back to workspace when nothing is left", () => {
    expect(slugify("!!!")).toBe("workspace");
  });
});
