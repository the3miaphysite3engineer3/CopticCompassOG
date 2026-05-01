"use server";

/**
 * tts.ts
 * Server actions for Coptic TTS synthesis via external API.
 */

const TTS_BASE = "https://readipa.azurewebsites.net/api/RetrieveAudio";

/**
 * Fetch synthesized audio for an IPA string from the external API.
 * Returns a Base64 encoded string of the MP3/WAV audio.
 */
// eslint-disable-next-line complexity
export async function getPremiumAudio(
  ipaText: string,
  voiceId: string,
  rate: number = 0,
): Promise<{ base64Audio: string; mimeType: string }> {
  // Strip non-IPA/non-word characters that might cause the API to throw a 400 Bad Request
  // Keep standard letters, IPA symbols, and basic spaces.
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
    const response = await fetch(url, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} - ${response.statusText}`);
    }

    let mimeType = response.headers.get("content-type") || "";
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length === 0) {
      throw new Error("Received empty audio buffer from TTS API");
    }

    // Check if the API returned a JSON error payload instead of audio
    if (buffer[0] === 0x7b || buffer[0] === 0x5b) {
      // '{' or '['
      const text = buffer.toString("utf8");
      throw new Error(`TTS API returned JSON instead of audio: ${text}`);
    }

    // Check if the API returned an HTML error page
    if (buffer[0] === 0x3c) {
      // '<'
      const text = buffer.toString("utf8", 0, Math.min(buffer.length, 500));
      throw new Error(`TTS API returned HTML instead of audio: ${text}`);
    }

    // Detect actual mime type from magic bytes if the server returned generic octet-stream
    // or if we want to be absolutely sure.
    if (buffer.length > 4) {
      if (
        buffer[0] === 0x52 &&
        buffer[1] === 0x49 &&
        buffer[2] === 0x46 &&
        buffer[3] === 0x46
      ) {
        // "RIFF" -> WAV
        mimeType = "audio/wav";
      } else if (
        (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) || // ID3
        (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0) // MPEG ADTS
      ) {
        mimeType = "audio/mpeg";
      }
    }

    let base64Audio = buffer.toString("base64");

    // CRITICAL FIX: The Azure API might be returning the audio ALREADY AS A BASE64 STRING!
    // If the buffer contains the ASCII string "UklGR" (Base64 for "RIFF"), then it's a raw base64 string.
    const textBuffer = buffer.toString("utf8").trim();
    if (textBuffer.startsWith("UklGR")) {
      mimeType = "audio/wav";
      base64Audio = textBuffer;
    } else if (
      textBuffer.startsWith("//NEx") ||
      textBuffer.startsWith("SUQz")
    ) {
      mimeType = "audio/mpeg";
      base64Audio = textBuffer;
    } else if (
      textBuffer.startsWith('"UklGR') ||
      textBuffer.startsWith('"//NEx') ||
      textBuffer.startsWith('"SUQz')
    ) {
      // In case it's wrapped in quotes like a JSON string
      mimeType = textBuffer.includes("UklGR") ? "audio/wav" : "audio/mpeg";
      base64Audio = textBuffer.replace(/(^"|"$)/g, "");
    }

    if (
      !mimeType ||
      mimeType === "application/octet-stream" ||
      mimeType.includes("json") ||
      mimeType.includes("text")
    ) {
      mimeType = "audio/mpeg"; // Fallback
    }

    return {
      base64Audio,
      mimeType,
    };
  } catch (error) {
    console.error("[getPremiumAudio] Failed to fetch audio:", error);
    throw new Error("Failed to synthesize premium audio.");
  }
}
