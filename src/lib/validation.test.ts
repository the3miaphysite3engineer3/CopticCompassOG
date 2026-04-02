import { describe, expect, it } from "vitest";
import { getFormLanguage } from "./validation";

describe("getFormLanguage", () => {
  it("returns the requested supported language", () => {
    const formData = new FormData();
    formData.set("locale", "nl");

    expect(getFormLanguage(formData)).toBe("nl");
  });

  it("supports custom field names", () => {
    const formData = new FormData();
    formData.set("language", "en");

    expect(getFormLanguage(formData, "language")).toBe("en");
  });

  it("falls back to English for unsupported values", () => {
    const formData = new FormData();
    formData.set("locale", "fr");

    expect(getFormLanguage(formData)).toBe("en");
  });
});
