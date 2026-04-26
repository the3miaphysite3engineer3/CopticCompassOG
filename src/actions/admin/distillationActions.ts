"use server";

import { generateText } from "ai";

import { ingestCopticDocuments } from "@/actions/vectorSearch";
import { requestNMTTranslation } from "@/lib/copticTranslator";
import {
  recordDistillationExample,
  formatNMTForDistillation
} from "@/lib/distillation";
import { getGeminiModel } from "@/lib/gemini";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";
// Moved type import below library imports to fix import/order
import type { Json } from "@/types/supabase";

/**
 * Distills the NMT model using existing chunks from the knowledge base.
 */
// eslint-disable-next-line complexity
export async function distillModelFromChunks(options: {
  limit?: number;
  taskType?: "translation";
}): Promise<any[]> { // Added explicit return type
  const limit = options.limit ?? 5;
  const supabase = createServiceRoleClient();

  const { data: chunks, error: fetchError } = await supabase
    .from("coptic_documents")
    .select("id, content, metadata")
    .limit(limit);

  if (fetchError || !chunks) {
    throw new Error(`Failed to fetch chunks for distillation: ${fetchError?.message}`);
  }

  const results = [];

  for (const chunk of chunks) {
    try {
      const distillationPrompt = `You are an expert Coptic linguist. 
Based on the following knowledge base chunk, create a translation task.
CHUNK:
"""
${chunk.content}
"""

TASK:
1. Isolate a single meaningful sentence or phrase from the chunk (in either Coptic or English).
2. Provide an authoritative, expert translation for that phrase.
3. Identify the translation direction and dialect.

Respond ONLY with a valid JSON object:
{
  "sourceText": "...",
  "expertTranslation": "...",
  "direction": "english-to-coptic" | "coptic-to-english",
  "dialect": "Bohairic" | "Sahidic"
}
`;

      const { text: expertResponse } = await generateText({
        model: getGeminiModel(),
        prompt: distillationPrompt,
      });

      const parsed = JSON.parse(expertResponse.replace(/```json/i, "").replace(/```/g, "").trim());

      const NMTSuggestion = await requestNMTTranslation({
        dialect: parsed.dialect,
        direction: parsed.direction,
        originalPrompt: `Distillation task: ${parsed.sourceText}`,
        textToTranslate: parsed.sourceText,
      });

      await recordDistillationExample({
        sourceDocumentId: chunk.id,
        taskType: "translation",
        prompt: parsed.sourceText,
        teacherAnswer: parsed.expertTranslation,
        studentTarget: NMTSuggestion ? formatNMTForDistillation(NMTSuggestion) : undefined,
        metadata: {
          distillation_type: "batch_chunk",
          chunk_id: chunk.id,
          direction: parsed.direction,
          dialect: parsed.dialect
        }
      });

      results.push({
        chunkId: chunk.id,
        source: parsed.sourceText,
        expert: parsed.expertTranslation,
        learner: NMTSuggestion?.translatedText ?? "failed",
        confidence: NMTSuggestion?.confidenceLabel
      });

    } catch (err) {
      console.error(`Distillation failed for chunk ${chunk.id}:`, err);
    }
  }

  return results;
}

/**
 * Distills the model and creates NEW ingestable chunks in the knowledge base.
 */
// eslint-disable-next-line complexity
export async function distillToNewIngestableChunks(options: {
  limit?: number;
  provider?: "hf" | "gemini" | "openrouter";
}): Promise<{ originalChunksProcessed: number; newChunksIngested: number }> { // Added explicit return type
  const limit = options.limit ?? 5;
  const provider = options.provider ?? "hf";
  const supabase = createServiceRoleClient();

  const { data: chunks, error: fetchError } = await supabase
    .from("coptic_documents")
    .select("id, content, metadata")
    .not("metadata->>type", "eq", "translation_distillation_chunk")
    .limit(limit);

  if (fetchError || !chunks) {
    throw new Error(`Failed to fetch chunks: ${fetchError?.message}`);
  }

  const newChunks: { content: string; metadata: Json }[] = [];

  for (const chunk of chunks) {
    try {
      const distillationPrompt = `Based on the following Coptic/English chunk, create a high-quality, standalone translation pair.
CHUNK:
"""
${chunk.content}
"""

TASK:
Isolate one clear sentence. Provide its English text, its Coptic translation, direction, and dialect.

Respond ONLY with valid JSON:
{
  "sourceText": "...",
  "expertTranslation": "...",
  "direction": "...",
  "dialect": "..."
}
`;

      const { text: expertResponse } = await generateText({
        model: getGeminiModel(),
        prompt: distillationPrompt,
      });

      const parsed = JSON.parse(expertResponse.replace(/```json/i, "").replace(/```/g, "").trim());

      const newChunkContent = `Translation Pair [${parsed.dialect}]:
English: ${parsed.direction === "english-to-coptic" ? parsed.sourceText : parsed.expertTranslation}
Coptic: ${parsed.direction === "english-to-coptic" ? parsed.expertTranslation : parsed.sourceText}
Direction: ${parsed.direction}`;

      newChunks.push({
        content: newChunkContent,
        metadata: {
          type: "translation_distillation_chunk",
          source_chunk_id: chunk.id,
          dialect: parsed.dialect,
          direction: parsed.direction,
          distilled_at: new Date().toISOString()
        }
      });

    } catch (err) {
      console.error(`Distillation failed for chunk ${chunk.id}:`, err);
    }
  }

  if (newChunks.length > 0) {
    await ingestCopticDocuments(newChunks, provider);
  }

  return {
    originalChunksProcessed: chunks.length,
    newChunksIngested: newChunks.length
  };
}