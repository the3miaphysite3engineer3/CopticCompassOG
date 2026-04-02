import { describe, expect, it } from "vitest";
import { stripLoginFlashParams } from "./loginNotice";

describe("stripLoginFlashParams", () => {
  it("removes login flash params while preserving redirect targets", () => {
    const searchParams = new URLSearchParams({
      state: "auth-unavailable",
      messageType: "error",
      redirect_to: "/dashboard",
    });

    expect(stripLoginFlashParams("/login", searchParams)).toBe(
      "/login?redirect_to=%2Fdashboard",
    );
  });

  it("removes custom message params from the login URL", () => {
    const searchParams = new URLSearchParams({
      message: "Try again later",
      messageType: "error",
    });

    expect(stripLoginFlashParams("/login", searchParams)).toBe("/login");
  });

  it("preserves unrelated query params", () => {
    const searchParams = new URLSearchParams({
      redirect_to: "/dictionary",
      foo: "bar",
    });

    expect(stripLoginFlashParams("/login", searchParams)).toBe(
      "/login?redirect_to=%2Fdictionary&foo=bar",
    );
  });
});
