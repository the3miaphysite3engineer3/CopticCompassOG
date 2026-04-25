import { describe, expect, it, vi } from "vitest";

type VectorSearchModuleContext = {
  createServiceRoleClientMock: ReturnType<typeof vi.fn>;
  rpcMock: ReturnType<typeof vi.fn>;
  searchCopticDocuments: typeof import("./vectorSearch").searchCopticDocuments;
};

async function loadVectorSearchModule(): Promise<VectorSearchModuleContext> {
  vi.resetModules();

  const rpcMock = vi.fn(function (
    this: { rest?: object },
    _fn: string,
    _args: unknown,
  ) {
    if (!this?.rest) {
      throw new TypeError(
        "Cannot read properties of undefined (reading 'rest')",
      );
    }

    return Promise.resolve({
      data: [{ content: "Dictionary chunk", metadata: { sourceName: "test" } }],
      error: null,
    });
  });

  const createServiceRoleClientMock = vi.fn().mockReturnValue({
    rest: {},
    rpc: rpcMock,
  });

  vi.doMock("@/lib/supabase/serviceRole", () => ({
    createServiceRoleClient: createServiceRoleClientMock,
  }));
  vi.doMock("@/lib/hf", () => ({
    generateHFEmbeddings: vi.fn().mockResolvedValue([[0.1, 0.2, 0.3]]),
  }));
  vi.doMock("@/lib/openrouter", () => ({
    generateOpenRouterEmbeddings: vi.fn(),
  }));
  vi.doMock("@/lib/gemini", () => ({
    getGeminiEmbeddingModel: vi.fn(),
  }));

  const vectorSearchModule = await import("./vectorSearch");

  return {
    createServiceRoleClientMock,
    rpcMock,
    searchCopticDocuments: vectorSearchModule.searchCopticDocuments,
  };
}

describe("searchCopticDocuments", () => {
  it("calls the RPC with the bound Supabase client context", async () => {
    const { createServiceRoleClientMock, rpcMock, searchCopticDocuments } =
      await loadVectorSearchModule();

    await expect(searchCopticDocuments("father")).resolves.toEqual([
      {
        content: "Dictionary chunk",
        metadata: { sourceName: "test" },
      },
    ]);

    expect(createServiceRoleClientMock).toHaveBeenCalledTimes(1);
    expect(rpcMock).toHaveBeenCalledWith(
      "match_coptic_documents",
      expect.objectContaining({
        filter_metadata: {},
        match_count: 5,
        query_text: "father",
      }),
    );
  });
});
