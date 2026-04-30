import { describe, expect, it } from "vitest";

import robots from "./robots";

describe("robots route", () => {
  it("publishes the site host and sitemap for crawlers", () => {
    expect(robots()).toEqual({
      rules: {
        userAgent: "*",
        allow: "/",
      },
      sitemap: "https://www.copticcompass.com/sitemap.xml",
      host: "https://www.copticcompass.com",
    });
  });
});
