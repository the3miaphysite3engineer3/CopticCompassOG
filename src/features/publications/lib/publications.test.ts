import { describe, expect, it } from "vitest";
import {
  buildPublicationDescription,
  getPublicationById,
} from "@/features/publications/lib/publications";

describe("publication descriptions", () => {
  it("describes publications as part of the Coptic Compass catalog", () => {
    const publication = getPublicationById("holy-bible-coptic");

    expect(publication).not.toBeNull();
    expect(buildPublicationDescription(publication!, "en")).toContain(
      "available through Coptic Compass",
    );
  });

  it("retains creator attribution while keeping the platform primary", () => {
    const publication = getPublicationById("speak-with-us-coptic-curriculum");

    expect(publication).not.toBeNull();
    expect(buildPublicationDescription(publication!, "en")).toContain(
      "by Kyrillos Wannes.",
    );
    expect(buildPublicationDescription(publication!, "en")).toContain(
      "available through Coptic Compass",
    );
  });
});
