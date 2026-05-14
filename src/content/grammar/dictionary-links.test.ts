import { describe, expect, it } from "vitest";

import {
  enrichGrammarDatasetSnapshotWithDictionaryLinks,
  getBohairicDictionaryEntryIdForWord,
} from "./dictionary-links.ts";
import { getGrammarDatasetSnapshot } from "./registry.ts";

import type { GrammarBlock, GrammarInline } from "./schema.ts";

function getParagraphCopticNode(
  block: GrammarBlock | undefined,
): GrammarInline | undefined {
  if (!block || block.type !== "paragraph") {
    return undefined;
  }

  return block.content.find((node) => node.type === "coptic");
}

describe("grammar dictionary link enrichment", () => {
  it("resolves only unique Bohairic entry matches and ignores combining diacritics", () => {
    expect(getBohairicDictionaryEntryIdForWord("Ⲥⲟⲛ")).toBe("173");
    expect(getBohairicDictionaryEntryIdForWord("ⲥ̀ϩⲓⲙⲓ")).toBe("142");
    expect(getBohairicDictionaryEntryIdForWord("Ⲥⲱⲛⲓ")).toBe("11422");
    expect(getBohairicDictionaryEntryIdForWord("Ⲟⲩⲥⲱⲛⲓ")).toBe("11422");
    expect(getBohairicDictionaryEntryIdForWord("Ⲡⲁⲓⲥⲟⲛ")).toBe("173");
    expect(getBohairicDictionaryEntryIdForWord("Ⲟⲩⲓⲱⲧ")).toBe("57");
    expect(getBohairicDictionaryEntryIdForWord("ϭⲱⲓⲥ")).toBe("17");
    expect(getBohairicDictionaryEntryIdForWord("⳪")).toBe("17");
    expect(getBohairicDictionaryEntryIdForWord("ⳳⲉⲗⲗⲱ")).toBe("11413");
    expect(getBohairicDictionaryEntryIdForWord("ⳲⲈⲖⲖⲰ")).toBe("11413");
    expect(getBohairicDictionaryEntryIdForWord("ⳳⲉⲛ-")).toBe("361");
    expect(getBohairicDictionaryEntryIdForWord("ⳲⲈⲚ-")).toBe("361");
    expect(getBohairicDictionaryEntryIdForWord("Ⲛ̀ⲑⲟⲥ")).toBe("11428");
    expect(getBohairicDictionaryEntryIdForWord("Ⲛ̀ⲑⲱⲟⲩ")).toBe("11429");
    expect(getBohairicDictionaryEntryIdForWord("Ϣⲏⲣⲓ")).toBeNull();
    expect(getBohairicDictionaryEntryIdForWord("ⲙⲁⲩ")).toBeNull();
    expect(getBohairicDictionaryEntryIdForWord("Ⲧⲁⲙⲁⲩ")).toBeNull();
    expect(getBohairicDictionaryEntryIdForWord("Ⲛ̀ⲑⲟϥ")).toBe("1178");
  });

  it("annotates canonical lesson content when a unique Bohairic match exists", () => {
    const snapshot = enrichGrammarDatasetSnapshotWithDictionaryLinks(
      getGrammarDatasetSnapshot(),
    );
    const lesson = snapshot.lessons.find((item) => item.slug === "lesson-1");
    const vocabularySection = lesson?.sections.find(
      (section) => section.slug === "vocabulary-bare-nouns",
    );
    const vocabularyTable = vocabularySection?.blocks.en[1];

    expect(vocabularyTable?.type).toBe("table");

    if (!vocabularyTable || vocabularyTable.type !== "table") {
      return;
    }

    const masculineBrotherWord = getParagraphCopticNode(
      vocabularyTable.rows[2]?.cells.masculineWord[0],
    );
    const feminineWomanWord = getParagraphCopticNode(
      vocabularyTable.rows[0]?.cells.feminineWord[0],
    );
    const feminineMotherWord = getParagraphCopticNode(
      vocabularyTable.rows[1]?.cells.feminineWord[0],
    );
    const feminineSisterWord = getParagraphCopticNode(
      vocabularyTable.rows[2]?.cells.feminineWord[0],
    );
    const masculineSonWord = getParagraphCopticNode(
      vocabularyTable.rows[3]?.cells.masculineWord[0],
    );

    expect(feminineWomanWord).toMatchObject({
      type: "coptic",
      text: "Ⲥ̀ϩⲓⲙⲓ",
      dictionaryEntryId: "142",
    });
    expect(feminineMotherWord).toMatchObject({
      type: "coptic",
      text: "Ⲙⲁⲩ",
      dictionaryEntryId: "215",
    });
    expect(feminineSisterWord).toMatchObject({
      type: "coptic",
      text: "Ⲥⲱⲛⲓ",
      dictionaryEntryId: "11422",
    });
    expect(masculineBrotherWord).toMatchObject({
      type: "coptic",
      text: "Ⲥⲟⲛ",
      dictionaryEntryId: "173",
    });
    expect(masculineSonWord).toMatchObject({
      type: "coptic",
      text: "Ϣⲏⲣⲓ",
      dictionaryEntryId: "20",
    });

    const motherExample = snapshot.examples.find(
      (example) =>
        example.id === "grammar.example.lesson01.nominal-sentence.004",
    );
    const everyManExample = snapshot.examples.find(
      (example) =>
        example.id === "grammar.example.lesson01.zero-determination.001",
    );

    expect(motherExample?.copticSegments).toMatchObject([
      { text: "Ⲧⲁⲙⲁⲩ", dictionaryEntryId: "215" },
      { text: " " },
      { text: "ⲧⲉ" },
      { text: "." },
    ]);
    expect(everyManExample?.copticSegments).toMatchObject([
      { text: "Ø-ⲣⲱⲙⲓ", dictionaryEntryId: "21" },
      { text: " " },
      { text: "ⲛⲓⲃⲉⲛ" },
    ]);
  });
});
