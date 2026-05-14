import { describe, expect, it } from "vitest";

import { buildStructuredJsonChunks } from "./structuredJsonChunks";

describe("buildStructuredJsonChunks", () => {
  it("builds one chunk per dictionary entry by default", () => {
    const chunks = buildStructuredJsonChunks(
      JSON.stringify([
        {
          dialects: {
            B: {
              absolute: "rome",
            },
          },
          headword: "rome",
          senses: [
            {
              grammar: { pos: "N" },
              meanings: { en: ["man", "person"] },
            },
          ],
        },
        {
          dialects: {},
          headword: "shimi",
          senses: [
            {
              grammar: { pos: "N" },
              meanings: { en: ["woman"] },
            },
          ],
        },
      ]),
    );

    expect(chunks).toHaveLength(2);
    expect(chunks?.[0]?.metadata.word).toBe("rome");
    expect(chunks?.[0]?.metadata.englishTranslation).toBe("man, person");
    expect(chunks?.[0]?.metadata.englishTranslations).toEqual([
      "man",
      "person",
    ]);
    expect(chunks?.[0]?.metadata.partOfSpeech).toBe("N");
  });

  it("uses structured dictionary meanings", () => {
    const chunks = buildStructuredJsonChunks(
      JSON.stringify([
        {
          dialects: {
            B: {
              absolute: "ti",
            },
          },
          headword: "ti",
          senses: [
            {
              grammar: { pos: "V", valency: "TR" },
              meanings: { en: ["give"] },
            },
            {
              grammar: { form: "PC", pos: "V" },
              meanings: { en: ["giver"] },
            },
          ],
        },
      ]),
    );

    expect(chunks).toHaveLength(1);
    expect(chunks?.[0]?.content).toContain("English meanings: give, giver.");
    expect(chunks?.[0]?.metadata.englishTranslation).toBe("give, giver");
    expect(chunks?.[0]?.metadata.englishTranslations).toEqual([
      "give",
      "giver",
    ]);
  });

  it("compacts dictionary entries for bulk ingestion", () => {
    const entries = Array.from({ length: 13 }, (_, index) => ({
      dialects: {},
      headword: `word-${index + 1}`,
      senses: [
        {
          grammar: { pos: "N" },
          meanings: { en: [`meaning-${index + 1}`] },
        },
      ],
    }));

    const chunks = buildStructuredJsonChunks(JSON.stringify(entries), {
      mode: "compact",
    });

    expect(chunks).toHaveLength(2);
    expect(chunks?.[0]?.metadata.entryCount).toBe(12);
    expect(chunks?.[0]?.metadata.englishTranslations).toContain("meaning-1");
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

  it("stores english translation metadata for grammar examples", () => {
    const chunks = buildStructuredJsonChunks(
      JSON.stringify({
        data: [
          {
            coptic: "sample coptic",
            id: "grammar.example.test",
            translation: {
              en: "He is a father.",
              nl: "Hij is een vader.",
            },
          },
        ],
      }),
    );

    expect(chunks).toHaveLength(1);
    expect(chunks?.[0]?.metadata.englishTranslation).toBe("He is a father.");
    expect(chunks?.[0]?.metadata.translation).toBe("He is a father.");
  });
});
