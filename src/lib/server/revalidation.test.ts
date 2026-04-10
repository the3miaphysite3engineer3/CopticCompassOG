import { describe, expect, it } from "vitest";

import {
  getAdminPathsToRevalidate,
  getDashboardPathsToRevalidate,
} from "./revalidation";

describe("server revalidation helpers", () => {
  it("includes the base and localized dashboard paths", () => {
    expect(getDashboardPathsToRevalidate()).toEqual([
      "/dashboard",
      "/en/dashboard",
      "/nl/dashboard",
    ]);
  });

  it("includes the base and localized admin paths", () => {
    expect(getAdminPathsToRevalidate()).toEqual([
      "/admin",
      "/en/admin",
      "/nl/admin",
    ]);
  });
});
