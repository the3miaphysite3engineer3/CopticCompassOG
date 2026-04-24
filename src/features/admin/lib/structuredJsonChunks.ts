export type StructuredJsonChunk = {
  content: string;
  metadata: Record<string, unknown>;
};

export type StructuredJsonChunkMode = "default" | "compact";

type BuildStructuredJsonChunksOptions = {
  mode?: StructuredJsonChunkMode;
};

const IGNORED_TEXT_KEYS = new Set([
  "conceptrefs",
  "datasetversion",
  "dictionaryrefs",
  "generatedat",
  "id",
  "lessonid",
  "lessonrefs",
  "relatedconceptrefs",
  "schemaversion",
  "sectionid",
  "slug",
  "sourcerefs",
  "updatedat",
]);

const COMPACT_DICTIONARY_MAX_ENTRIES = 12;
const COMPACT_DICTIONARY_TARGET_CHARS = 2400;

type DictionaryEntry = {
  dialects?: unknown;
  english_meanings?: unknown;
  headword?: unknown;
  pos?: unknown;
};

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function uniqueStrings(values: string[]) {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const value of values) {
    const normalized = normalizeWhitespace(value);
    if (!normalized) {
      continue;
    }

    const key = normalized.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    unique.push(normalized);
  }

  return unique;
}

function collectTextSegments(value: unknown, depth = 0): string[] {
  if (depth > 10 || value === null || typeof value === "undefined") {
    return [];
  }

  if (typeof value === "string") {
    const normalized = normalizeWhitespace(value);
    return normalized ? [normalized] : [];
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return [String(value)];
  }

  if (Array.isArray(value)) {
    return uniqueStrings(
      value.flatMap((entry) => collectTextSegments(entry, depth + 1)),
    );
  }

  if (typeof value !== "object") {
    return [];
  }

  const record = value as Record<string, unknown>;

  if ("en" in record) {
    const englishSegments = collectTextSegments(record.en, depth + 1);
    if (englishSegments.length > 0) {
      return englishSegments;
    }
  }

  const collected: string[] = [];

  if (typeof record.text === "string") {
    collected.push(record.text);
  }

  if (typeof record.fallback === "string") {
    collected.push(record.fallback);
  }

  if (typeof record.coptic === "string") {
    collected.push(record.coptic);
  }

  for (const [key, childValue] of Object.entries(record)) {
    const normalizedKey = key.toLowerCase();
    if (
      normalizedKey === "en" ||
      normalizedKey === "text" ||
      normalizedKey === "fallback" ||
      normalizedKey === "coptic" ||
      IGNORED_TEXT_KEYS.has(normalizedKey)
    ) {
      continue;
    }

    collected.push(...collectTextSegments(childValue, depth + 1));
  }

  return uniqueStrings(collected);
}

function pickFirstText(...values: unknown[]) {
  for (const value of values) {
    const match = collectTextSegments(value)[0];
    if (match) {
      return match;
    }
  }

  return "";
}

function formatDictionaryEntry(
  entry: DictionaryEntry,
): StructuredJsonChunk | null {
  if (typeof entry.headword !== "string" || typeof entry.pos !== "string") {
    return null;
  }

  const dialects =
    entry.dialects && typeof entry.dialects === "object"
      ? (entry.dialects as Record<string, unknown>)
      : {};

  const dialectSummaries = Object.entries(dialects)
    .map(([dialectName, dialectValue]) => {
      if (!dialectValue || typeof dialectValue !== "object") {
        return "";
      }

      const absolute = (dialectValue as { absolute?: unknown }).absolute;
      return typeof absolute === "string" ? `${dialectName}: ${absolute}` : "";
    })
    .filter((dialect) => dialect.length > 0);

  const meanings = Array.isArray(entry.english_meanings)
    ? entry.english_meanings
        .filter((value): value is string => typeof value === "string")
        .map((value) => normalizeWhitespace(value))
        .filter((value) => value.length > 0)
    : [];

  const contentParts = [
    `Coptic dictionary entry: ${entry.headword}.`,
    `Part of speech: ${entry.pos}.`,
    dialectSummaries.length > 0
      ? `Dialects: ${dialectSummaries.join(", ")}.`
      : "",
    meanings.length > 0 ? `English meanings: ${meanings.join(", ")}.` : "",
  ].filter((part) => part.length > 0);

  return {
    content: contentParts.join(" "),
    metadata: {
      type: "vocabulary",
      word: entry.headword,
      translation: meanings.join(", "),
      partOfSpeech: entry.pos,
    },
  };
}

function compactDictionaryChunks(chunks: StructuredJsonChunk[]) {
  const compacted: StructuredJsonChunk[] = [];
  let currentBatch: StructuredJsonChunk[] = [];
  let currentChars = 0;

  function flushCurrentBatch() {
    if (currentBatch.length === 0) {
      return;
    }

    const headwords = uniqueStrings(
      currentBatch.flatMap((chunk) =>
        typeof chunk.metadata.word === "string" ? [chunk.metadata.word] : [],
      ),
    );
    const partsOfSpeech = uniqueStrings(
      currentBatch.flatMap((chunk) =>
        typeof chunk.metadata.partOfSpeech === "string"
          ? [chunk.metadata.partOfSpeech]
          : [],
      ),
    );

    compacted.push({
      content: [
        "Coptic dictionary entries:",
        ...currentBatch.map((chunk) => chunk.content),
      ].join("\n"),
      metadata: {
        batchMode: "compact",
        entryCount: currentBatch.length,
        headwords,
        partsOfSpeech,
        type: "vocabulary",
      },
    });

    currentBatch = [];
    currentChars = 0;
  }

  for (const chunk of chunks) {
    const nextChars = currentChars + chunk.content.length;
    if (
      currentBatch.length >= COMPACT_DICTIONARY_MAX_ENTRIES ||
      (currentBatch.length > 0 && nextChars > COMPACT_DICTIONARY_TARGET_CHARS)
    ) {
      flushCurrentBatch();
    }

    currentBatch.push(chunk);
    currentChars += chunk.content.length;
  }

  flushCurrentBatch();
  return compacted;
}

function buildGenericRecordChunk(
  record: Record<string, unknown>,
): StructuredJsonChunk | null {
  const title = pickFirstText(
    record.title,
    record.name,
    record.label,
    record.id,
  );
  const coptic = pickFirstText(record.coptic);
  const translation = pickFirstText(record.translation);
  const summary = pickFirstText(
    record.summary,
    record.description,
    record.definition,
    record.prompt,
  );
  const detailText = uniqueStrings(
    collectTextSegments(
      record.blocks ?? record.content ?? record.notes ?? record,
    ),
  )
    .filter(
      (segment) =>
        segment !== title && segment !== coptic && segment !== translation,
    )
    .join(" ");

  const parts = [
    title ? `Title: ${title}.` : "",
    coptic ? `Coptic: ${coptic}.` : "",
    translation ? `Translation: ${translation}.` : "",
    summary ? `Summary: ${summary}.` : "",
    detailText ? `Details: ${detailText}.` : "",
  ].filter((part) => part.length > 0);

  if (parts.length === 0) {
    return null;
  }

  let type = "json_data";
  if (typeof record.coptic === "string") {
    type = "grammar_example";
  } else if (typeof record.prompt !== "undefined") {
    type = "grammar_exercise";
  } else if (typeof record.definition !== "undefined") {
    type = "grammar";
  }

  return {
    content: parts.join(" "),
    metadata: {
      title: title || null,
      type,
    },
  };
}

function buildLessonChunks(lessonRecord: Record<string, unknown>) {
  const lesson = (
    lessonRecord.data &&
    typeof lessonRecord.data === "object" &&
    !Array.isArray(lessonRecord.data) &&
    "lesson" in (lessonRecord.data as Record<string, unknown>)
      ? (lessonRecord.data as Record<string, unknown>).lesson
      : lessonRecord.lesson
  ) as Record<string, unknown> | undefined;

  if (!lesson || typeof lesson !== "object") {
    return [] as StructuredJsonChunk[];
  }

  const lessonId = typeof lesson.id === "string" ? lesson.id : null;
  const lessonSlug = typeof lesson.slug === "string" ? lesson.slug : null;
  const lessonTitle = pickFirstText(lesson.title, lessonSlug, lessonId);
  const lessonSummary = pickFirstText(lesson.summary, lesson.description);
  const tags = Array.isArray(lesson.tags)
    ? lesson.tags.filter((tag): tag is string => typeof tag === "string")
    : [];

  const chunks: StructuredJsonChunk[] = [];

  chunks.push({
    content: [
      lessonTitle ? `Grammar lesson: ${lessonTitle}.` : "Grammar lesson.",
      lessonSummary ? `Overview: ${lessonSummary}.` : "",
      tags.length > 0 ? `Tags: ${tags.join(", ")}.` : "",
    ]
      .filter((part) => part.length > 0)
      .join(" "),
    metadata: {
      lessonId,
      lessonSlug,
      type: "grammar_lesson",
    },
  });

  const sections = Array.isArray(lesson.sections) ? lesson.sections : [];

  for (const sectionRaw of sections) {
    if (!sectionRaw || typeof sectionRaw !== "object") {
      continue;
    }

    const section = sectionRaw as Record<string, unknown>;
    const sectionTitle = pickFirstText(section.title, section.slug, section.id);
    const sectionSummary = pickFirstText(section.summary);
    const sectionText = uniqueStrings(
      collectTextSegments(section.blocks ?? section),
    )
      .filter((segment) => segment !== sectionTitle)
      .join(" ");

    const content = [
      sectionTitle ? `Lesson section: ${sectionTitle}.` : "",
      sectionSummary ? `Summary: ${sectionSummary}.` : "",
      sectionText ? `Content: ${sectionText}.` : "",
    ]
      .filter((part) => part.length > 0)
      .join(" ");

    if (!content) {
      continue;
    }

    chunks.push({
      content,
      metadata: {
        lessonId,
        lessonSlug,
        sectionId: typeof section.id === "string" ? section.id : null,
        sectionSlug: typeof section.slug === "string" ? section.slug : null,
        type: "grammar_lesson_section",
      },
    });
  }

  return chunks;
}

export function buildStructuredJsonChunks(
  text: string,
  options: BuildStructuredJsonChunksOptions = {},
) {
  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }

  const mode = options.mode ?? "default";

  if (Array.isArray(parsed)) {
    const dictionaryChunks = parsed
      .map((entry) => formatDictionaryEntry(entry as DictionaryEntry))
      .filter((entry): entry is StructuredJsonChunk => Boolean(entry));

    if (
      dictionaryChunks.length === parsed.length &&
      dictionaryChunks.length > 0
    ) {
      return mode === "compact"
        ? compactDictionaryChunks(dictionaryChunks)
        : dictionaryChunks;
    }

    const genericChunks = parsed
      .map((entry) =>
        entry && typeof entry === "object"
          ? buildGenericRecordChunk(entry as Record<string, unknown>)
          : null,
      )
      .filter((entry): entry is StructuredJsonChunk => Boolean(entry));

    return genericChunks.length > 0 ? genericChunks : null;
  }

  if (!parsed || typeof parsed !== "object") {
    return null;
  }

  const lessonChunks = buildLessonChunks(parsed as Record<string, unknown>);
  if (lessonChunks.length > 0) {
    return lessonChunks;
  }

  const record = parsed as Record<string, unknown>;

  if (Array.isArray(record.data)) {
    const genericDataChunks = record.data
      .map((entry) =>
        entry && typeof entry === "object"
          ? buildGenericRecordChunk(entry as Record<string, unknown>)
          : null,
      )
      .filter((entry): entry is StructuredJsonChunk => Boolean(entry));

    if (genericDataChunks.length > 0) {
      return genericDataChunks;
    }
  }

  const genericChunk = buildGenericRecordChunk(record);
  return genericChunk ? [genericChunk] : null;
}
