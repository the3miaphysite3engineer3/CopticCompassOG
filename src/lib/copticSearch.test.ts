import { describe, expect, it } from "vitest";

import {
  buildCopticSearchRegex,
  normalizeCopticSearchText,
} from "./copticSearch";

describe("coptic search helpers", () => {
  it("normalizes khei variants to the same canonical search form", () => {
    expect(normalizeCopticSearchText("ⳳⲉⲛ")).toBe("ⳳⲉⲛ");
    expect(normalizeCopticSearchText("  ⳲⲈⲚ  ")).toBe("ⳳⲉⲛ");
    expect(normalizeCopticSearchText("\u03e7ⲉⲛ")).toBe("ⳳⲉⲛ");
    expect(normalizeCopticSearchText("  \u03e6ⲈⲚ  ")).toBe("ⳳⲉⲛ");
  });

  it("builds a regex that matches rendered khei variants", () => {
    const regex = buildCopticSearchRegex("ⳲⲈⲚ");

    expect(regex?.test("ⳲⲈⲚ")).toBe(true);
    expect(regex?.test("ⳳⲉⲛ")).toBe(true);
    expect(regex?.test("\u03e6ⲈⲚ")).toBe(true);
    expect(regex?.test("\u03e7ⲉⲛ")).toBe(true);
  });

  it("ignores jinkim while matching Bohairic spellings", () => {
    expect(normalizeCopticSearchText("ⲙ̀ⲙⲟ=")).toBe("ⲙⲙⲟ=");
    expect(normalizeCopticSearchText("ⲙⲙⲟ=")).toBe("ⲙⲙⲟ=");

    const regex = buildCopticSearchRegex("ⲙ̀ⲙⲟ=");

    expect(regex?.test("ⲙ̀ⲙⲟ=")).toBe(true);
    expect(regex?.test("ⲙⲙⲟ=")).toBe(true);
  });
});
