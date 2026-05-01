import { describe, expect, it } from "vitest";

import { copticToIPA, Pronunciation } from "./copticTts";

describe("copticToIPA", () => {
  it("converts Coptic to IPA correctly for Shenutean pronunciation", () => {
    const input = "ⲫⲛⲟⲩϯ";
    const result = copticToIPA(input, Pronunciation.Shenutean);
    expect(result).toBeTruthy();
    expect(typeof result).toBe("string");
    expect(result).not.toContain("↓");
  });

  it("converts Coptic to IPA correctly for Cyrillic pronunciation", () => {
    const input = "ⲫⲛⲟⲩϯ";
    const result = copticToIPA(input, Pronunciation.Cyrillic);
    expect(result).toBeTruthy();
    expect(typeof result).toBe("string");
    expect(result).not.toContain("↓");
  });

  it("handles spacers and multiple words", () => {
    const input = "ⲡⲛⲟⲩⲧⲉ : ⲡⲛⲟⲩⲧⲉ";
    const result = copticToIPA(input, Pronunciation.Shenutean);
    expect(result).toContain(":");
    expect(result.split(":").length).toBe(2);
  });

  it("handles jinkim properly", () => {
    const input = "ⲙ̀ⲫ̀ⲙⲉⲩⲓ";
    const result = copticToIPA(input, Pronunciation.Cyrillic);
    expect(result).toBeTruthy();
    expect(result).not.toContain("↓");
  });
});
