"use server";

/**
 * tts.ts
 * Server actions for Coptic TTS synthesis via external API.
 */

const TTS_BASE = "https://readipa.azurewebsites.net/api/RetrieveAudio";

/** RIFF header (WAV) magic bytes. */
const WAV_MAGIC = [0x52, 0x49, 0x46, 0x46] as const;
/** ID3 header (MP3) magic bytes. */
const ID3_MAGIC = [0x49, 0x44, 0x33] as const;

function hasWavHeader(buffer: Buffer): boolean {
  return (
    buffer[0] === WAV_MAGIC[0] &&
    buffer[1] === WAV_MAGIC[1] &&
    buffer[2] === WAV_MAGIC[2] &&
    buffer[3] === WAV_MAGIC[3]
  );
}

function hasMpegHeader(buffer: Buffer): boolean {
  const isId3 =
    buffer[0] === ID3_MAGIC[0] &&
    buffer[1] === ID3_MAGIC[1] &&
    buffer[2] === ID3_MAGIC[2];
  const isAdts = buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0;
  return isId3 || isAdts;
}

/**
 * Detect the MIME type of audio data from magic bytes.
 * Returns `null` when no known audio signature is found.
 */
function detectMimeFromBuffer(buffer: Buffer): string | null {
  if (buffer.length <= 4) {
    return null;
  }

  if (hasWavHeader(buffer)) {
    return "audio/wav";
  }

  if (hasMpegHeader(buffer)) {
    return "audio/mpeg";
  }

  return null;
}

/**
 * Inspect `buffer` for a Base64-encoded audio payload the Azure API sometimes
 * returns instead of raw binary.  Returns the resolved `{ base64Audio, mimeType }`
 * when a known Base64 prefix is detected, or `null` otherwise.
 */
function tryResolveBase64Payload(
  buffer: Buffer,
): { base64Audio: string; mimeType: string } | null {
  const text = buffer.toString("utf8").trim();

  if (text.startsWith("UklGR")) {
    return { base64Audio: text, mimeType: "audio/wav" };
  }

  if (text.startsWith("//NEx") || text.startsWith("SUQz")) {
    return { base64Audio: text, mimeType: "audio/mpeg" };
  }

  if (
    text.startsWith('"UklGR') ||
    text.startsWith('"//NEx') ||
    text.startsWith('"SUQz')
  ) {
    return {
      base64Audio: text.replace(/(^"|"$)/g, ""),
      mimeType: text.includes("UklGR") ? "audio/wav" : "audio/mpeg",
    };
  }

  return null;
}

/**
 * Validate that `buffer` contains audio data rather than an error payload.
 * Throws a descriptive error when JSON or HTML is detected.
 */
function assertAudioPayload(buffer: Buffer): void {
  if (buffer.length === 0) {
    throw new Error("Received empty audio buffer from TTS API");
  }

  if (buffer[0] === 0x7b || buffer[0] === 0x5b) {
    const text = buffer.toString("utf8");
    throw new Error(`TTS API returned JSON instead of audio: ${text}`);
  }

  if (buffer[0] === 0x3c) {
    const text = buffer.toString("utf8", 0, Math.min(buffer.length, 500));
    throw new Error(`TTS API returned HTML instead of audio: ${text}`);
  }
}

/** Return a fallback MIME when the server provided something unhelpful. */
function normalizeMimeType(raw: string): string {
  if (
    !raw ||
    raw === "application/octet-stream" ||
    raw.includes("json") ||
    raw.includes("text")
  ) {
    return "audio/mpeg";
  }

  return raw;
}

/**
 * Fetch synthesized audio for an IPA string from the external API.
 * Returns a Base64 encoded string of the MP3/WAV audio.
 */
export async function getPremiumAudio(
  ipaText: string,
  voiceId: string,
  rate: number = 0,
): Promise<{ base64Audio: string; mimeType: string }> {
  const sanitizedIpa = ipaText
    .replace(
      /[^\p{L}\s\u0250-\u02AF\u02B0-\u02FF\u0300-\u036F\u1D00-\u1D7F\u1D80-\u1DBF\u1E00-\u1EFF\u2070-\u209F\u2016\u203F\.]/gu,
      "",
    )
    .trim();

  const params = new URLSearchParams({
    words: sanitizedIpa,
    voice: voiceId,
    rate: String(rate),
  });

  const url = `${TTS_BASE}?${params.toString()}`;

  try {
    const response = await fetch(url, { method: "GET" });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} - ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    assertAudioPayload(buffer);

    // The Azure API may return audio already encoded as a Base64 string.
    const resolved = tryResolveBase64Payload(buffer);
    if (resolved) {
      return resolved;
    }

    const mimeType =
      detectMimeFromBuffer(buffer) ??
      normalizeMimeType(response.headers.get("content-type") || "");
    const base64Audio = buffer.toString("base64");

    return { base64Audio, mimeType };
  } catch (error) {
    console.error("[getPremiumAudio] Failed to fetch audio:", error);
    throw new Error("Failed to synthesize premium audio.");
  }
}
