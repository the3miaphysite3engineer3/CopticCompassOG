import { describe, expect, it } from "vitest";
import { getLanguageFromPathname } from "./preferredLanguage";

describe("getLanguageFromPathname", () => {
  it("returns a supported locale from locale-prefixed routes", () => {
    expect(getLanguageFromPathname("/en")).toBe("en");
    expect(getLanguageFromPathname("/nl/privacy")).toBe("nl");
  });

  it("returns null for non-localized routes", () => {
    expect(getLanguageFromPathname("/login")).toBeNull();
    expect(getLanguageFromPathname("/dashboard")).toBeNull();
    expect(getLanguageFromPathname(null)).toBeNull();
  });
});
