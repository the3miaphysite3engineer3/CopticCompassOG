import { describe, expect, it } from "vitest";

import {
  readJsonResponse,
  safeParseJson,
  summarizeResponseText,
} from "./response";

describe("safeParseJson", () => {
  it("parses valid JSON", () => {
    expect(safeParseJson<{ ok: boolean }>('{ "ok": true }')).toEqual({
      ok: true,
    });
  });

  it("returns null for invalid JSON", () => {
    expect(safeParseJson("An error occurred")).toBeNull();
  });
});

describe("readJsonResponse", () => {
  it("reads and parses JSON responses", async () => {
    const response = new Response('{ "success": true }', {
      headers: {
        "Content-Type": "application/json",
      },
      status: 200,
    });

    await expect(
      readJsonResponse<{ success: boolean }>(response),
    ).resolves.toEqual({
      data: { success: true },
      text: '{ "success": true }',
    });
  });
});

describe("summarizeResponseText", () => {
  it("strips HTML wrappers from response bodies", () => {
    expect(
      summarizeResponseText(
        "<html><body><h1>An error occurred.</h1><p>Please retry later.</p></body></html>",
        "Fallback message",
      ),
    ).toBe("An error occurred. Please retry later.");
  });

  it("falls back when the response body is empty", () => {
    expect(summarizeResponseText("   ", "Fallback message")).toBe(
      "Fallback message",
    );
  });
});
