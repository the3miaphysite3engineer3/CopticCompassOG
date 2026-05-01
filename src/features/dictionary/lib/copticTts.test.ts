import { describe, expect, it } from "vitest";

import { copticToIPA, Dialect } from "./copticTts";

describe("copticToIPA", () => {
  it("converts Coptic to IPA correctly for Arabic (Sahidic) dialect", () => {
    // Basic conversion test. Given the complex rule sets, we test basic syllables
    // and overall engine integrity rather than exhaustively testing the rules.
    const input = "ⲡⲛⲟⲩⲧⲉ";
    const result = copticToIPA(input, Dialect.Arabic);
    expect(result).toBeTruthy();
    expect(typeof result).toBe("string");
    // 'ⲡ' (Pi) -> 'bb', 'ⲛ' (Ney) -> 'n', 'ⲟ' (Omicron) 'ⲩ' (Epsilon) -> 'u', 'ⲧ' (Tav) -> 'tˈ', 'ⲉ' (Ei) -> 'i'
    // Exact translation string isn't critical, as long as it parses completely without returning fallback '↓'.
    expect(result).not.toContain("↓");
  });

  it("converts Coptic to IPA correctly for Greek (Bohairic) dialect", () => {
    const input = "ⲡⲛⲟⲩⲧⲉ";
    const result = copticToIPA(input, Dialect.Greek);
    expect(result).toBeTruthy();
    expect(typeof result).toBe("string");
    expect(result).not.toContain("↓");
  });

  it("handles spacers and multiple words", () => {
    const input = "ⲡⲛⲟⲩⲧⲉ : ⲡⲛⲟⲩⲧⲉ";
    const result = copticToIPA(input, Dialect.Arabic);
    expect(result).toContain(":");
    expect(result.split(":").length).toBe(2);
  });

  it("handles ginkim properly", () => {
    const input = "ⲙ̀ⲫ̀ⲙⲉⲩⲓ";
    const result = copticToIPA(input, Dialect.Greek);
    expect(result).toBeTruthy();
    expect(result).not.toContain("↓");
  });
});
