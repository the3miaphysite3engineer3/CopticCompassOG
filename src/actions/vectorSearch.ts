"use server";

import { embedMany } from "ai";

import { getGeminiEmbeddingModel } from "@/lib/gemini";
import { generateHFEmbeddings } from "@/lib/hf";
import { generateOpenRouterEmbeddings } from "@/lib/openrouter";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";

const GEMINI_EMBEDDING_OUTPUT_DIMENSION = Number(
  process.env.GEMINI_EMBEDDING_OUTPUT_DIMENSION ?? "3072",
);

type CopticDocumentMatch = {
  content: string;
  metadata: Record<string, unknown> | null;
  [key: string]: unknown;
};

type MatchDocumentsRpcArgs = {
  filter_metadata: Record<string, unknown>;
  match_count: number;
  query_embedding: string;
  query_text: string;
};

type MatchDocumentsRpcResult = {
  data: CopticDocumentMatch[] | null;
  error: { message: string } | null;
};

async function generateQueryEmbedding(
  provider: "hf" | "gemini" | "openrouter",
  query: string,
): Promise<number[]> {
  if (provider === "openrouter") {
    const embeddings = await generateOpenRouterEmbeddings([query]);
    const embedding = embeddings[0];
    if (!Array.isArray(embedding) || embedding.length === 0) {
      throw new Error("OpenRouter embedding failed");
    }

    return embedding;
  }

  if (provider === "gemini") {
    const { embeddings } = await embedMany({
      model: getGeminiEmbeddingModel(),
      values: [query],
      providerOptions: {
        google: {
          outputDimensionality: GEMINI_EMBEDDING_OUTPUT_DIMENSION,
          taskType: "RETRIEVAL_DOCUMENT",
        },
      },
    });

    const embedding = embeddings[0];
    if (!Array.isArray(embedding) || embedding.length === 0) {
      throw new Error("Gemini embedding failed");
    }

    return embedding;
  }

  const hfEmbeddings = await generateHFEmbeddings([query]);
  const hfEmbedding = hfEmbeddings[0];
  if (!Array.isArray(hfEmbedding) || hfEmbedding.length === 0) {
    throw new Error("HF embedding failed");
  }

  return hfEmbedding;
}

function normalizeEmbeddingDimensions(
  embedding: number[],
  targetDimensions = 768,
) {
  if (embedding.length === targetDimensions) {
    return embedding;
  }

  if (embedding.length > targetDimensions) {
    return embedding.slice(0, targetDimensions);
  }

  return [
    ...embedding,
    ...new Array(targetDimensions - embedding.length).fill(0),
  ];
}

function sanitizeKeywordForIlike(keyword: string) {
  return keyword.replace(/[^\p{L}\p{N}\s-]/gu, "").trim();
}

export async function searchCopticDocuments(
  query: string,
  matchCount: number = 5,
  metadataFilter: Record<string, unknown> = {},
  provider: "hf" | "gemini" | "openrouter" = "hf",
): Promise<CopticDocumentMatch[]> {
  const rawEmbedding = await generateQueryEmbedding(provider, query);

  const queryEmbedding = normalizeEmbeddingDimensions(rawEmbedding, 768);

  const supabase = createServiceRoleClient();
  const matchDocuments = supabase.rpc.bind(supabase) as unknown as (
    fn: "match_coptic_documents",
    args: MatchDocumentsRpcArgs,
  ) => Promise<MatchDocumentsRpcResult>;

  const { data, error } = await matchDocuments("match_coptic_documents", {
    query_embedding: `[${queryEmbedding.join(",")}]`,
    query_text: query,
    match_count: matchCount,
    filter_metadata: metadataFilter,
  });

  if (error) {
    throw new Error(`Vector search failed: ${error.message}`);
  }

  return data ?? [];
}

export async function searchVocabularyByKeywords(
  keywords: string[],
): Promise<CopticDocumentMatch[]> {
  if (!keywords || keywords.length === 0) {
    return [];
  }

  const sanitizedKeywords = keywords
    .map((keyword) => sanitizeKeywordForIlike(keyword))
    .filter(Boolean);
  if (sanitizedKeywords.length === 0) {
    return [];
  }

  const supabase = createServiceRoleClient();

  // Create an ILIKE query for each keyword.
  const orFilters = sanitizedKeywords
    .map((keyword) => `content.ilike.%${keyword}%`)
    .join(",");

  const { data, error } = await supabase
    .from("coptic_documents")
    .select("content, metadata")
    .or(orFilters)
    .in("metadata->>type", ["vocabulary", "vocabulary_xml"])
    .limit(30);

  if (error) {
    console.error(
      "Failed to search vocabulary chunks by keyword:",
      error.message,
    );
    return [];
  }

  return (data ?? []) as CopticDocumentMatch[];
}

/**
 * Ingests a set of documents into the knowledge base, generating embeddings for them.
 */
export async function ingestCopticDocuments(
  documents: { content: string; metadata: Record<string, unknown> }[],
  provider: "hf" | "gemini" | "openrouter" = "hf",
) {
  if (documents.length === 0) {
    return;
  }

  const values = documents.map((doc) => doc.content);
  let rawEmbeddings: number[][] = [];

  if (provider === "gemini") {
    const { embeddings } = await embedMany({
      model: getGeminiEmbeddingModel(),
      values,
      providerOptions: {
        google: {
          outputDimensionality: GEMINI_EMBEDDING_OUTPUT_DIMENSION,
          taskType: "RETRIEVAL_DOCUMENT",
        },
      },
    });
    rawEmbeddings = embeddings;
  } else if (provider === "openrouter") {
    rawEmbeddings = await generateOpenRouterEmbeddings(values);
  } else {
    rawEmbeddings = await generateHFEmbeddings(values);
  }

  const supabase = createServiceRoleClient();
  const records = documents.map((doc, i) => ({
    content: doc.content,
    metadata: doc.metadata,
    embedding: `[${normalizeEmbeddingDimensions(rawEmbeddings[i], 768).join(",")}]`,
  }));

  const { error } = await supabase.from("coptic_documents").insert(records);

  if (error) {
    throw new Error(`Failed to ingest documents: ${error.message}`);
  }
}
