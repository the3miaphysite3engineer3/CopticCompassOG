import { createServiceRoleClient } from "@/lib/supabase/serviceRole";
import type { Json } from "@/types/supabase";

import { type NMTTranslationSuggestion } from "./copticTranslator";

type DistillTaskType =
  | "qa"
  | "rewrite"
  | "retrieval"
  | "contrastive"
  | "translation";

type DistillExampleInput = {
  runId?: string;
  sourceDocumentId?: number;
  sourceChunkHash?: string;
  taskType: DistillTaskType;
  prompt: string;
  teacherAnswer: string;
  studentTarget?: Json;
  metadata?: Json;
};

type JsonObject = { [key: string]: Json };

async function getOrCreateDistillRunId(
  runId?: string,
): Promise<string | undefined> {
  if (runId) {
    return runId;
  }

  const supabase = createServiceRoleClient();
  const { data: run, error: runError } = await supabase
    .from("distill_runs")
    .select("id")
    .eq("metadata->>type", "online_distillation")
    .eq("status", "running")
    .limit(1)
    .single();

  if (runError || !run) {
    const { data: newRun, error: createError } = await supabase
      .from("distill_runs")
      .insert({
        teacher_name: "Shenute AI Expert (Gemini)",
        learner_name: "Shenute AI Learner (NMT)",
        status: "running",
        metadata: { type: "online_distillation" },
      })
      .select("id")
      .single();

    if (createError) {
      console.error("Failed to create online distillation run:", createError);
      return undefined;
    }
    return newRun.id;
  }
  return run.id;
}

/**
 * Records a distillation example into Supabase.
 * This can be used for online distillation (capturing live expert/learner pairs)
 * or batch distillation (synthetic data generation).
 */
export async function recordDistillationExample(input: DistillExampleInput) {
  const supabase = createServiceRoleClient();

  // If no runId is provided, we can either skip or use a default "online_distillation" run
  const runId = await getOrCreateDistillRunId(input.runId);
  if (!runId) {
    return;
  }

  const metadata: JsonObject = {
    recorded_at: new Date().toISOString(),
    ...(typeof input.metadata === "object" &&
    input.metadata !== null &&
    !Array.isArray(input.metadata)
      ? input.metadata
      : {}),
  };

  const { error } = await supabase.from("distill_examples").insert({
    run_id: runId,
    source_document_id: input.sourceDocumentId,
    source_chunk_hash: input.sourceChunkHash ?? "online",
    task_type: input.taskType,
    prompt: input.prompt,
    teacher_answer: input.teacherAnswer,
    student_target: (input.studentTarget ?? {}) as Json,
    metadata,
  });

  if (error) {
    console.error("Failed to record distillation example:", error);
  }
}

/**
 * Formats a NMT suggestion for distillation.
 */
export function formatNMTForDistillation(suggestion: NMTTranslationSuggestion) {
  return {
    translatedText: suggestion.translatedText,
    confidence: suggestion.confidence,
    confidenceLabel: suggestion.confidenceLabel,
    modelId: suggestion.modelId,
    direction: suggestion.direction,
    dialect: suggestion.dialect,
  };
}
