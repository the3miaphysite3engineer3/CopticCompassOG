import { describe, expect, it } from "vitest";
import { normalizeStructuredData } from "./StructuredData";

describe("normalizeStructuredData", () => {
  it("keeps single JSON-LD objects unchanged", () => {
    const data = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Example",
    };

    expect(normalizeStructuredData(data)).toEqual(data);
  });

  it("wraps multiple JSON-LD objects into a shared @graph payload", () => {
    const data = [
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "@id": "https://example.com/dictionary#page",
      },
      {
        "@context": "https://schema.org",
        "@type": "DefinedTermSet",
        "@id": "https://example.com/dictionary#set",
      },
    ];

    expect(normalizeStructuredData(data)).toEqual({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "CollectionPage",
          "@id": "https://example.com/dictionary#page",
        },
        {
          "@type": "DefinedTermSet",
          "@id": "https://example.com/dictionary#set",
        },
      ],
    });
  });
});
