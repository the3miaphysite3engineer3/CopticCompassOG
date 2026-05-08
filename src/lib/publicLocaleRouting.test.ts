import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  requirePublicLocale,
  resolvePublicLocale,
} from "./publicLocaleRouting";

describe("publicLocaleRouting", () => {
  it("falls back to the default locale for unknown locale params", () => {
    expect(resolvePublicLocale(undefined)).toBe("en");
    expect(resolvePublicLocale("fr")).toBe("en");
  });

  it("keeps supported public locales unchanged", () => {
    expect(resolvePublicLocale("en")).toBe("en");
    expect(resolvePublicLocale("nl")).toBe("nl");
    expect(requirePublicLocale("en")).toBe("en");
    expect(requirePublicLocale("nl")).toBe("nl");
  });

  it("stays free of request-bound language resolution", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "src/lib/publicLocaleRouting.ts"),
      "utf8",
    );

    expect(source).not.toContain("next/headers");
    expect(source).not.toContain("getPreferredLanguage");
  });
});
