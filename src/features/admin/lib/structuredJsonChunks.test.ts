import { describe, expect, it } from "vitest";

import { buildStructuredJsonChunks } from "./structuredJsonChunks";

describe("buildStructuredJsonChunks", () => {
  it("builds one chunk per dictionary entry by default", () => {
    const chunks = buildStructuredJsonChunks(
      JSON.stringify([
        {
          dialects: {
            B: {
              absolute: "ⲣⲱⲙⲓ",
            },
          },
          english_meanings: ["man", "person"],
          headword: "Ⲣⲱⲙⲓ",
          pos: "noun",
        },
        {
          dialects: {},
          english_meanings: ["woman"],
          headword: "Ⲥ̀ϩⲓⲙⲓ",
          pos: "noun",
        },
      ]),
    );

    expect(chunks).toHaveLength(2);
    expect(chunks?.[0]?.metadata.word).toBe("Ⲣⲱⲙⲓ");
  });

  it("compacts dictionary entries for bulk ingestion", () => {
    const entries = Array.from({ length: 13 }, (_, index) => ({
      dialects: {},
      english_meanings: [`meaning-${index + 1}`],
      headword: `word-${index + 1}`,
      pos: "noun",
    }));

    const chunks = buildStructuredJsonChunks(JSON.stringify(entries), {
      mode: "compact",
    });

    expect(chunks).toHaveLength(2);
    expect(chunks?.[0]?.metadata.entryCount).toBe(12);
    expect(chunks?.[1]?.metadata.entryCount).toBe(1);
  });

  it("extracts lesson sections into readable chunks", () => {
    const chunks = buildStructuredJsonChunks(
      JSON.stringify({
        data: {
          lesson: {
            id: "grammar.lesson.01",
            sections: [
              {
                id: "grammar.lesson.01.section.definitions",
                title: { en: "Definitions" },
                summary: { en: "Introduces the main terms." },
                blocks: {
                  en: [
                    {
                      type: "paragraph",
                      content: [
                        {
                          type: "text",
                          text: "A bare noun is a base form without a determiner.",
                        },
                      ],
                    },
                  ],
                },
              },
            ],
            slug: "lesson-1",
            summary: {
              en: "Master the basics of Coptic nouns and determiners.",
            },
            tags: ["foundations", "nouns"],
            title: { en: "Lesson 01" },
          },
        },
      }),
    );

    expect(chunks).toHaveLength(2);
    expect(chunks?.[0]?.content).toContain("Grammar lesson: Lesson 01.");
    expect(chunks?.[1]?.content).toContain("Lesson section: Definitions.");
    expect(chunks?.[1]?.content).toContain(
      "A bare noun is a base form without a determiner.",
    );
  });
});
