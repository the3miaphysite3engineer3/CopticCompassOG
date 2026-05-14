import { beforeEach, describe, expect, it, vi } from "vitest";

type QueryResult = {
  data?: unknown;
  error: unknown;
};

function createSelectBuilder(result: QueryResult) {
  const builder = {
    eq: vi.fn(() => builder),
    order: vi.fn().mockResolvedValue(result),
    select: vi.fn(() => builder),
  };

  return builder;
}

function createDeleteBuilder(result: QueryResult) {
  let eqCount = 0;
  const builder = {
    eq: vi.fn(() => {
      eqCount += 1;
      return eqCount >= 2 ? Promise.resolve(result) : builder;
    }),
  };

  return {
    builder,
    delete: vi.fn(() => builder),
  };
}

async function loadHistoryRoute(options: {
  existingMessages?: unknown[];
  messages?: unknown[];
  sessions?: unknown[];
}) {
  vi.resetModules();

  const sessions = options.sessions ?? [
    {
      id: "11111111-1111-4111-8111-111111111111",
      title: "Shenute AI conversation",
      updated_at: "2026-05-08T10:00:00.000Z",
    },
  ];
  const sessionSelectBuilder = createSelectBuilder({
    data: sessions,
    error: null,
  });
  const messageSelectBuilder = createSelectBuilder({
    data: options.messages ?? [],
    error: null,
  });
  const existingMessageSelectBuilder = createSelectBuilder({
    data: options.existingMessages ?? [],
    error: null,
  });
  const sessionDeleteBuilder = createDeleteBuilder({ error: null });
  const sessionUpsertMock = vi.fn().mockResolvedValue({ error: null });
  const messageUpsertMock = vi.fn().mockResolvedValue({ error: null });
  let chatMessageSelectCount = 0;

  const fromMock = vi.fn((table: string) => {
    if (table === "chat_sessions") {
      return {
        delete: sessionDeleteBuilder.delete,
        select: sessionSelectBuilder.select,
        upsert: sessionUpsertMock,
      };
    }

    if (table === "chat_messages") {
      chatMessageSelectCount += 1;
      const selectBuilder =
        chatMessageSelectCount === 1
          ? messageSelectBuilder
          : existingMessageSelectBuilder;

      return {
        select: selectBuilder.select,
        upsert: messageUpsertMock,
      };
    }

    throw new Error(`Unexpected table: ${table}`);
  });

  vi.doMock("@/lib/supabase/config", () => ({
    hasSupabaseRuntimeEnv: () => true,
  }));
  vi.doMock("@/lib/supabase/server", () => ({
    createClient: vi.fn().mockResolvedValue({ from: fromMock }),
  }));
  vi.doMock("@/lib/supabase/authQueries", () => ({
    getAuthenticatedUser: vi.fn().mockResolvedValue({ id: "user-1" }),
  }));

  const mod = await import("./route");

  return {
    ...mod,
    sessionDeleteBuilder: sessionDeleteBuilder.builder,
    sessionDeleteMock: sessionDeleteBuilder.delete,
    messageUpsertMock,
  };
}

describe("Shenute history route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deduplicates restored messages by client message id", async () => {
    const { GET } = await loadHistoryRoute({
      messages: [
        {
          id: "row-1",
          client_message_id: "client-1",
          role: "user",
          content: "Old prompt",
          metadata: { parts: [{ text: "Old prompt", type: "text" }] },
        },
        {
          id: "row-2",
          client_message_id: "client-1",
          role: "user",
          content: "Updated prompt",
          metadata: { parts: [{ text: "Updated prompt", type: "text" }] },
        },
        {
          id: "row-3",
          client_message_id: "client-2",
          role: "assistant",
          content: "Answer",
          metadata: null,
        },
      ],
    });

    const response = await GET(
      new Request("https://www.copticcompass.com/api/shenute/history"),
    );
    const payload = await response.json();

    expect(payload.messages).toEqual([
      {
        id: "client-1",
        role: "user",
        content: "Updated prompt",
        parts: [{ text: "Updated prompt", type: "text" }],
      },
      {
        id: "client-2",
        role: "assistant",
        content: "Answer",
      },
    ]);
  });

  it("deduplicates messages before saving history", async () => {
    const { POST, messageUpsertMock } = await loadHistoryRoute({
      existingMessages: [],
    });

    const response = await POST(
      new Request("https://www.copticcompass.com/api/shenute/history", {
        method: "POST",
        body: JSON.stringify({
          sessionId: "11111111-1111-4111-8111-111111111111",
          messages: [
            {
              id: "client-1",
              role: "user",
              content: "Old prompt",
              parts: [{ text: "Old prompt", type: "text" }],
            },
            {
              id: "client-1",
              role: "user",
              content: "Updated prompt",
              parts: [{ text: "Updated prompt", type: "text" }],
            },
            {
              id: "client-2",
              role: "assistant",
              content: "Answer",
            },
          ],
        }),
      }),
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    const rows = messageUpsertMock.mock.calls[0]?.[0];

    expect(payload.sessions).toEqual([
      {
        id: "11111111-1111-4111-8111-111111111111",
        title: "Shenute AI conversation",
        updated_at: "2026-05-08T10:00:00.000Z",
      },
    ]);
    expect(rows).toHaveLength(2);
    expect(
      rows.map((row: { client_message_id: string }) => row.client_message_id),
    ).toEqual(["client-1", "client-2"]);
    expect(rows[0]).toMatchObject({
      client_message_id: "client-1",
      content: "Updated prompt",
      role: "user",
    });
  });

  it("rejects oversized history payloads before saving", async () => {
    const { POST, messageUpsertMock } = await loadHistoryRoute({});

    const response = await POST(
      new Request("https://www.copticcompass.com/api/shenute/history", {
        method: "POST",
        headers: {
          "content-length": String(256 * 1024 + 1),
        },
        body: JSON.stringify({ messages: [] }),
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(413);
    expect(payload).toEqual({
      success: false,
      error: "Shenute history payload is too large.",
    });
    expect(messageUpsertMock).not.toHaveBeenCalled();
  });

  it("deletes a user's selected chat session", async () => {
    const { DELETE, sessionDeleteBuilder, sessionDeleteMock } =
      await loadHistoryRoute({});

    const response = await DELETE(
      new Request(
        "https://www.copticcompass.com/api/shenute/history?sessionId=11111111-1111-4111-8111-111111111111",
        { method: "DELETE" },
      ),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      success: true,
      sessionId: "11111111-1111-4111-8111-111111111111",
    });
    expect(sessionDeleteMock).toHaveBeenCalled();
    expect(sessionDeleteBuilder.eq).toHaveBeenCalledWith(
      "id",
      "11111111-1111-4111-8111-111111111111",
    );
    expect(sessionDeleteBuilder.eq).toHaveBeenCalledWith("user_id", "user-1");
  });
});
