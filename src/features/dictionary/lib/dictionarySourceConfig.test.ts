import { describe, expect, it } from "vitest";
import {
  loadDictionarySourceConfig,
  loadCuratedDerivedEntryDefinitions,
  loadPromotedRelatedEntryDefinitions,
} from "./dictionarySourceConfig";

describe("dictionary source config", () => {
  it("loads the canonical master dictionary JSON", () => {
    const config = loadDictionarySourceConfig();

    expect(config.curatedDerivedEntries).toHaveLength(3);
    expect(config.promotedRelatedEntries).toHaveLength(9);
  });

  it("loads curated derived entry definitions from canonical JSON", () => {
    const definitions = loadCuratedDerivedEntryDefinitions();

    expect(definitions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "cd_173a",
          headword: "ⲥⲱⲛⲓ",
          parentEntryId: "cd_173",
        }),
        expect.objectContaining({
          id: "cd_493a",
          headword: "ⲛⲑⲟⲥ",
          parentEntryId: "cd_493",
        }),
      ]),
    );
  });

  it("loads promoted related entry definitions from canonical JSON", () => {
    const definitions = loadPromotedRelatedEntryDefinitions();

    expect(definitions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "cd_20a",
          parentEntryId: "cd_20",
          form: "ϣⲉⲣⲓ",
        }),
        expect.objectContaining({
          id: "cd_1048a",
          parentEntryId: "cd_1048",
          form: "ⲉⲙⲛⲟⲧⲉ",
        }),
        expect.objectContaining({
          id: "cd_2268a",
          parentEntryId: "cd_2268",
          form: "(ⲉ)ϩⲑⲟⲣⲓ",
        }),
      ]),
    );
  });
});
