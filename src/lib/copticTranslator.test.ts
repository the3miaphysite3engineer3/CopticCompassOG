import { describe, expect, it } from "vitest";

import {
  parseTranslationConfidence,
  resolveNMTTranslationRequest,
} from "./copticTranslator";

describe("resolveNMTTranslationRequest", () => {
  it("extracts the English phrase for English-to-Coptic prompts", () => {
    expect(
      resolveNMTTranslationRequest(
        'Translate "Jesus Christ" into Bohairic Coptic.',
      ),
    ).toEqual({
      dialect: "Bohairic",
      direction: "english-to-coptic",
      originalPrompt: 'Translate "Jesus Christ" into Bohairic Coptic.',
      textToTranslate: "Jesus Christ",
    });
  });

  it("extracts Coptic text for meaning questions", () => {
    expect(
      resolveNMTTranslationRequest(
        "What does \u2c93\u2c8f\u2ca5\u2ca9\u2c93 \u2ca1\u2c89\u2cad\u2ca3\u2c93\u2ca5\u2ca7\u2c9f\u2ca5 mean in English?",
      ),
    ).toEqual({
      dialect: "Bohairic",
      direction: "coptic-to-english",
      originalPrompt:
        "What does \u2c93\u2c8f\u2ca5\u2ca9\u2c93 \u2ca1\u2c89\u2cad\u2ca3\u2c93\u2ca5\u2ca7\u2c9f\u2ca5 mean in English?",
      textToTranslate:
        "\u2c93\u2c8f\u2ca5\u2ca9\u2c93 \u2ca1\u2c89\u2cad\u2ca3\u2c93\u2ca5\u2ca7\u2c9f\u2ca5",
    });
  });

  it("treats standalone Coptic input as a Coptic-to-English request", () => {
    expect(
      resolveNMTTranslationRequest("\u2c93\u2c8f\u2ca5 \u2ca1\u2cad\u2ca5"),
    ).toEqual({
      dialect: "Bohairic",
      direction: "coptic-to-english",
      originalPrompt: "\u2c93\u2c8f\u2ca5 \u2ca1\u2cad\u2ca5",
      textToTranslate: "\u2c93\u2c8f\u2ca5 \u2ca1\u2cad\u2ca5",
    });
  });

  it("returns null for non-translation prompts", () => {
    expect(
      resolveNMTTranslationRequest(
        "Explain how the Bohairic definite article works in this sentence.",
      ),
    ).toBeNull();
  });
});

describe("parseTranslationConfidence", () => {
  it("parses confidence percentages into decimals", () => {
    expect(parseTranslationConfidence("99.35%")).toBeCloseTo(0.9935);
  });

  it("returns null when confidence is absent", () => {
    expect(parseTranslationConfidence(null)).toBeNull();
    expect(parseTranslationConfidence("confidence unavailable")).toBeNull();
  });
});
