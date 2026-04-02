import { describe, expect, it } from "vitest";
import { redactEmailAddress } from "./privacy";

describe("redactEmailAddress", () => {
  it("masks most of the local part while preserving the domain", () => {
    expect(redactEmailAddress("reader@example.com")).toBe("re***@example.com");
    expect(redactEmailAddress("a@example.com")).toBe("a***@example.com");
  });

  it("normalizes casing and handles empty or malformed values safely", () => {
    expect(redactEmailAddress(" READER@Example.com ")).toBe(
      "re***@example.com",
    );
    expect(redactEmailAddress(null)).toBeNull();
    expect(redactEmailAddress("not-an-email")).toBe("[redacted email]");
  });
});
