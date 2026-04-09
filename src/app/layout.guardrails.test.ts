import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

function readProjectFile(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("layout scalability guardrails", () => {
  it("keeps the localized public site on the split static-friendly root layout", () => {
    expect(fs.existsSync(path.join(process.cwd(), "src/app/layout.tsx"))).toBe(
      false,
    );
  });

  it("keeps the localized public layout free of request-bound server APIs", () => {
    const localizedLayout = readProjectFile(
      "src/app/(site)/[locale]/layout.tsx",
    );

    expect(localizedLayout).not.toContain("next/server");
    expect(localizedLayout).not.toContain("next/headers");
    expect(localizedLayout).not.toContain("connection(");
    expect(localizedLayout).not.toContain("getCspNonce");
    expect(localizedLayout).not.toContain("getPreferredLanguage");
  });
});
