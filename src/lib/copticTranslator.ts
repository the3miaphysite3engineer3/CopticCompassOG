type GradioLikeClient = {
  predict(endpoint: string, payload: Record<string, unknown>): Promise<unknown>;
};

type CopticDialect = "Bohairic" | "Sahidic";
type NMTTranslationDirection = "coptic-to-english" | "english-to-coptic";

export type NMTTranslationRequest = {
  dialect: CopticDialect;
  direction: NMTTranslationDirection;
  originalPrompt: string;
  textToTranslate: string;
};

export type NMTTranslationSuggestion = NMTTranslationRequest & {
  confidence: number | null;
  confidenceLabel: string | null;
  endpoint: "/translate_cop_to_en" | "/translate_en_to_cop";
  modelId: string;
  translatedText: string;
};

type GradioPredictionResponse = {
  data?: unknown;
};

type GlobalWithTranslatorClient = typeof globalThis & {
  __copticTranslatorClientPromise?: Promise<GradioLikeClient>;
};

const DEFAULT_TRANSLATOR_SPACE =
  process.env.NMT_TRANSLATOR_SPACE ??
  "georgtawadrous/english-coptic-translator";
const NMT_TRANSLATOR_TIMEOUT_MS = Number(
  process.env.NMT_TRANSLATOR_TIMEOUT_MS ?? "20000",
);
const COPTIC_CHAR_REGEX = /[\u03E2-\u03EF\u2C80-\u2CFF]/u;
const COPTIC_RUN_REGEX =
  /[\u03E2-\u03EF\u2C80-\u2CFF][\u0300-\u036f\u0483-\u0489\uFE20-\uFE2F\u03E2-\u03EF\u2C80-\u2CFF\s.,;:!?'"`()\[\]{}\-=/]*/gu;
const TRANSLATION_INTENT_REGEX =
  /\b(translate|translation|render|gloss|mean(?:ing)?|say|equivalent|vertaal|vertaling|beteken(?:t|is)|zeg)\b/i;
const TO_COPTIC_REGEX =
  /\b(?:into|to|in)\s+(?:coptic|koptisch|bohairic|bohairisch|sahidic|sahidisch)\b|\b(?:coptic|koptisch|bohairic|bohairisch|sahidic|sahidisch)\s+translation\b/i;
const TO_ENGLISH_REGEX =
  /\b(?:into|to|in)\s+(?:english|engels)\b|\b(?:english|engels)\s+translation\b/i;
const MEANING_PROMPT_REGEX =
  /\b(?:what does|meaning of|what is the meaning of|wat betekent)\b/i;
const COPTIC_TARGET_HINT_REGEX =
  /\b(?:coptic|koptisch|bohairic|bohairisch|sahidic|sahidisch)\b/i;
const QUOTED_SEGMENT_PATTERNS = [
  /"([^"\n]{1,500})"/g,
  /'([^'\n]{1,500})'/g,
  /`([^`\n]{1,500})`/g,
  /\u201C([^\u201D\n]{1,500})\u201D/gu,
  /\u2018([^\u2019\n]{1,500})\u2019/gu,
];
const EXPLICIT_TRANSLATION_TEXT_PATTERNS = [
  /(?:translate|vertaal|render|say|how do you say)\s+(.+?)\s+(?:into|to|in|naar(?:\s+het)?|als)\s+(?:english|engels|coptic|koptisch|bohairic|bohairisch|sahidic|sahidisch)\b/i,
  /(?:translate|vertaal|render)\s*:\s*(.+)$/i,
  /(?:what does|meaning of|what is the meaning of|wat betekent)\s+(.+?)(?:\?|$)/i,
];

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(
        new Error(
          `NMT translator timed out after ${timeoutMs}ms while waiting for Gradio.`,
        ),
      );
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  });
}

function normalizeTranslationCandidate(value: string) {
  return normalizeWhitespace(value)
    .replace(/^[\s:;,.!?()[\]{}<>"'`-]+/g, "")
    .replace(/[\s:;,.!?()[\]{}<>"'`-]+$/g, "")
    .replace(
      /^(?:the|this)\s+(?:phrase|sentence|word|term|text|excerpt)\s+/i,
      "",
    )
    .trim()
    .slice(0, 500);
}

function containsCopticScript(value: string) {
  return COPTIC_CHAR_REGEX.test(value);
}

function extractQuotedSegments(prompt: string) {
  const seen = new Set<string>();
  const segments: string[] = [];

  for (const pattern of QUOTED_SEGMENT_PATTERNS) {
    for (const match of prompt.matchAll(pattern)) {
      const candidate = normalizeTranslationCandidate(match[1] ?? "");
      if (!candidate || seen.has(candidate.toLowerCase())) {
        continue;
      }

      seen.add(candidate.toLowerCase());
      segments.push(candidate);
    }
  }

  return segments;
}

function extractLongestCopticSpan(prompt: string) {
  const matches = prompt.match(COPTIC_RUN_REGEX) ?? [];

  return matches
    .map((match) => normalizeTranslationCandidate(match))
    .filter(Boolean)
    .sort((left, right) => right.length - left.length)[0];
}

function extractExplicitTranslationCandidate(prompt: string) {
  for (const pattern of EXPLICIT_TRANSLATION_TEXT_PATTERNS) {
    const match = prompt.match(pattern);
    const candidate = normalizeTranslationCandidate(match?.[1] ?? "");
    if (candidate) {
      return candidate;
    }
  }

  return "";
}

function detectDialect(prompt: string): CopticDialect {
  if (/\bsahidic\b|\bsahidisch\b/i.test(prompt)) {
    return "Sahidic";
  }

  return "Bohairic";
}

function isStandaloneCopticText(prompt: string, copticSpan?: string) {
  if (!copticSpan) {
    return false;
  }

  const promptWithoutCoptic = normalizeWhitespace(
    prompt.replace(COPTIC_RUN_REGEX, " "),
  ).replace(/[.,;:!?()[\]{}<>"'`-]+/g, "");

  return promptWithoutCoptic.length === 0;
}

function detectDirection(
  prompt: string,
  copticSpan?: string,
): NMTTranslationDirection | null {
  if (TO_COPTIC_REGEX.test(prompt)) {
    return "english-to-coptic";
  }

  if (TO_ENGLISH_REGEX.test(prompt)) {
    return "coptic-to-english";
  }

  if (MEANING_PROMPT_REGEX.test(prompt) && copticSpan) {
    return "coptic-to-english";
  }

  if (TRANSLATION_INTENT_REGEX.test(prompt) && copticSpan) {
    return "coptic-to-english";
  }

  if (
    TRANSLATION_INTENT_REGEX.test(prompt) &&
    COPTIC_TARGET_HINT_REGEX.test(prompt)
  ) {
    return "english-to-coptic";
  }

  if (isStandaloneCopticText(prompt, copticSpan)) {
    return "coptic-to-english";
  }

  return null;
}

function chooseTranslationText(options: {
  copticSpan?: string;
  direction: NMTTranslationDirection;
  explicitCandidate: string;
  quotedSegments: string[];
}) {
  if (options.direction === "coptic-to-english" && options.copticSpan) {
    return options.copticSpan;
  }

  if (
    options.explicitCandidate &&
    (options.direction === "english-to-coptic"
      ? !containsCopticScript(options.explicitCandidate)
      : containsCopticScript(options.explicitCandidate))
  ) {
    return options.explicitCandidate;
  }

  const quotedCandidate = options.quotedSegments.find((segment) =>
    options.direction === "english-to-coptic"
      ? !containsCopticScript(segment)
      : containsCopticScript(segment),
  );
  if (quotedCandidate) {
    return quotedCandidate;
  }

  if (options.explicitCandidate) {
    return options.explicitCandidate;
  }

  return "";
}

function parsePredictionResponse(
  response: unknown,
): Pick<
  NMTTranslationSuggestion,
  "confidence" | "confidenceLabel" | "translatedText"
> | null {
  if (!response || typeof response !== "object") {
    return null;
  }

  const candidate = response as GradioPredictionResponse;
  if (!Array.isArray(candidate.data) || candidate.data.length === 0) {
    return null;
  }

  const translatedText =
    typeof candidate.data[0] === "string"
      ? normalizeWhitespace(candidate.data[0])
      : "";
  const confidenceLabel =
    typeof candidate.data[1] === "string"
      ? normalizeWhitespace(candidate.data[1])
      : null;

  if (!translatedText) {
    return null;
  }

  return {
    confidence: parseTranslationConfidence(confidenceLabel),
    confidenceLabel,
    translatedText,
  };
}

function isSuspiciousTranslationText(value: string) {
  const normalizedWords =
    value.toLowerCase().match(/[a-z\u03e2-\u03ef\u2c80-\u2cff]+/gu) ?? [];
  if (normalizedWords.length >= 4 && new Set(normalizedWords).size === 1) {
    return true;
  }

  return /^[?!.,\s]+$/.test(value);
}

async function createTranslatorClient(): Promise<GradioLikeClient> {
  const { Client } = await import("@gradio/client");
  return Client.connect(DEFAULT_TRANSLATOR_SPACE);
}

async function getTranslatorClient() {
  const globalWithTranslator = globalThis as GlobalWithTranslatorClient;

  if (!globalWithTranslator.__copticTranslatorClientPromise) {
    globalWithTranslator.__copticTranslatorClientPromise =
      createTranslatorClient().catch((error) => {
        globalWithTranslator.__copticTranslatorClientPromise = undefined;
        throw error;
      });
  }

  return globalWithTranslator.__copticTranslatorClientPromise;
}

export function parseTranslationConfidence(value: string | null) {
  const match = value?.match(/([0-9]+(?:\.[0-9]+)?)%/);
  if (!match) {
    return null;
  }

  const parsed = Number(match[1]);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed / 100;
}

export function resolveNMTTranslationRequest(
  prompt: string,
): NMTTranslationRequest | null {
  const normalizedPrompt = normalizeWhitespace(prompt);
  if (!normalizedPrompt) {
    return null;
  }

  const copticSpan = extractLongestCopticSpan(normalizedPrompt);
  const direction = detectDirection(normalizedPrompt, copticSpan);
  if (!direction) {
    return null;
  }

  const textToTranslate = chooseTranslationText({
    copticSpan,
    direction,
    explicitCandidate: extractExplicitTranslationCandidate(normalizedPrompt),
    quotedSegments: extractQuotedSegments(normalizedPrompt),
  });

  if (!textToTranslate) {
    return null;
  }

  return {
    dialect: detectDialect(normalizedPrompt),
    direction,
    originalPrompt: normalizedPrompt,
    textToTranslate,
  };
}

export async function requestNMTTranslation(
  request: NMTTranslationRequest,
): Promise<NMTTranslationSuggestion | null> {
  const client = await getTranslatorClient();
  const endpoint =
    request.direction === "english-to-coptic"
      ? "/translate_en_to_cop"
      : "/translate_cop_to_en";
  const payload =
    request.direction === "english-to-coptic"
      ? {
          dialect: request.dialect,
          english_text: request.textToTranslate,
          show_confidence: true,
        }
      : {
          coptic_text: request.textToTranslate,
          dialect: request.dialect,
          show_confidence: true,
        };

  const rawResponse = await withTimeout(
    client.predict(endpoint, payload),
    NMT_TRANSLATOR_TIMEOUT_MS,
  );
  console.warn(`[NMT] Raw response from ${endpoint}:`, rawResponse);
  const parsed = parsePredictionResponse(rawResponse);

  if (!parsed) {
    console.warn(`[NMT] No valid response parsed from ${endpoint}`);
    return null;
  }

  if (isSuspiciousTranslationText(parsed.translatedText)) {
    console.warn(
      `[NMT] Suspicious translation text rejected: "${parsed.translatedText}"`,
    );
    return null;
  }

  return {
    ...request,
    ...parsed,
    endpoint,
    modelId: DEFAULT_TRANSLATOR_SPACE,
  };
}
