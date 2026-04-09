import { Buffer } from "node:buffer";

import { describe, expect, it } from "vitest";

import { getDictionaryClientEntries } from "./dictionary";

const DICTIONARY_SEARCH_INDEX_MAX_BYTES = 3_000_000;

describe("dictionary scalability guardrails", () => {
  it("keeps the reduced dictionary search payload within the CI budget", () => {
    const payloadBytes = Buffer.byteLength(
      JSON.stringify(getDictionaryClientEntries()),
      "utf8",
    );

    expect(payloadBytes).toBeLessThanOrEqual(DICTIONARY_SEARCH_INDEX_MAX_BYTES);
  });
});
