import { describe, expect, it } from "vitest";
import sitemap from "./sitemap";

function getUrls() {
  return sitemap().map((entry) => entry.url);
}

describe("sitemap route", () => {
  it("includes high-value public landing pages and developer docs", () => {
    const urls = getUrls();

    expect(urls).toEqual(
      expect.arrayContaining([
        "https://kyrilloswannes.com/en",
        "https://kyrilloswannes.com/nl",
        "https://kyrilloswannes.com/en/dictionary",
        "https://kyrilloswannes.com/nl/grammar",
        "https://kyrilloswannes.com/en/developers",
        "https://kyrilloswannes.com/nl/analytics",
        "https://kyrilloswannes.com/en/contact",
        "https://kyrilloswannes.com/api-docs",
      ]),
    );
  });

  it("keeps private workspace routes out of the public sitemap", () => {
    const urls = getUrls();

    expect(urls).not.toContain("https://kyrilloswannes.com/en/dashboard");
    expect(urls).not.toContain("https://kyrilloswannes.com/nl/admin");
    expect(urls).not.toContain("https://kyrilloswannes.com/login");
  });
});
