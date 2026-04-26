// Bohairic Coptic advanced phonetic mapping
// Generates English **pseudo-phonetics** tuned for the Web Speech API (en-US).

const FRONT_VOWELS = ["ⲉ", "ⲏ", "ⲓ", "ⲩ"];
const VELAR_CONSONANTS = ["ⲅ", "ⲕ", "ⲝ", "ⲭ"];
const BOHAIRIC_VOWELS = ["ⲁ", "ⲉ", "ⲏ", "ⲓ", "ⲟ", "ⲩ", "ⲱ"];

/**
 * Converts a Bohairic Coptic string to a phonetic English approximation.
 * Follows Greco-Bohairic conventions and outputs a string optimized for
 * an English (en-US) text-to-speech engine.
 *
 * @param text - A string containing Bohairic Coptic Unicode characters
 * @returns A phonetic English string suitable for TTS input
 */
export function bohairicToPhonetic(text: string): string {
  if (!text) {
    return "";
  }

  // Normalize to lowercase for easier rule matching
  let normalized = text.toLowerCase();

  // Strip notational characters and symbols that TTS shouldn't pronounce
  // Includes: =, †, *, ~, [, ], (, ), and ⳪
  normalized = normalized.replace(/[=†*~\[\]()⳪]/g, "");

  // Replace slashes and hyphens with spaces to preserve word boundaries
  normalized = normalized.replace(/[\/\-]/g, " ");

  // Clean up jinkims: move combining jinkims before the character they modify
  normalized = normalized.replace(
    /([^\u0300\u032E\u02CB̀\s])[\u0300\u032E\u02CB̀]/g,
    "`$1",
  );
  // Standardize all standalone and combining jinkims to backtick
  normalized = normalized.replace(/[\u0300\u032E\u02CB̀]/g, "`");

  let result = "";
  let i = 0;

  while (i < normalized.length) {
    const char = normalized[i];
    const nextChar = i + 1 < normalized.length ? normalized[i + 1] : null;
    const prevChar = i > 0 ? normalized[i - 1] : null;

    if (char === "ⲟ" && nextChar === "ⲩ") {
      const afterOu = i + 2 < normalized.length ? normalized[i + 2] : null;
      const isPrevVowel = prevChar && BOHAIRIC_VOWELS.includes(prevChar);
      const isNextVowel = afterOu && BOHAIRIC_VOWELS.includes(afterOu);

      if (isPrevVowel || isNextVowel) {
        result += "w";
      } else {
        result += "oo";
      }
      i += 2;
      continue;
    }
    if (char === "ⲁ" && nextChar === "ⲩ") {
      result += "aw";
      i += 2;
      continue;
    }
    if (char === "ⲉ" && nextChar === "ⲩ") {
      result += "ew";
      i += 2;
      continue;
    }

    // Jinkim
    if (char === "`") {
      // If the next char is a vowel, it acts as a glottal stop.
      // If a consonant, it adds an "eh" sound before it.
      const nextIsVowel = nextChar && BOHAIRIC_VOWELS.includes(nextChar);
      result += nextIsVowel ? "-" : "eh-";
      i++;
      continue;
    }

    switch (char) {
      case "ⲁ":
        result += "ah";
        break;
      case "ⲃ":
        if (nextChar && BOHAIRIC_VOWELS.includes(nextChar)) {
          result += "v";
        } else {
          result += "b";
        }
        break;
      case "ⲅ":
        if (nextChar && FRONT_VOWELS.includes(nextChar)) {
          result += "y";
        } else if (nextChar && VELAR_CONSONANTS.includes(nextChar)) {
          result += "ng";
        } else {
          result += "g";
        }
        break;
      case "ⲇ":
        result += "d";
        break;
      case "ⲉ":
        if (nextChar === "ⲓ") {
          result += "ee";
          i++; // Skip the yota
        } else {
          result += "eh";
        }
        break;
      case "ⲍ":
        result += "z";
        break;
      case "ⲏ":
        result += "ee";
        break;
      case "ⲑ":
        result += "th";
        break;
      case "ⲓ":
        if (
          prevChar &&
          BOHAIRIC_VOWELS.includes(prevChar) &&
          prevChar !== "ⲉ"
        ) {
          result += "y";
        } else {
          result += "ee";
        }
        break;
      case "ⲕ":
        result += "k";
        break;
      case "ⲗ":
        result += "l";
        break;
      case "ⲙ":
        result += "m";
        break;
      case "ⲛ":
        result += "n";
        break;
      case "ⲝ":
        result += "ks";
        break;
      case "ⲟ":
        result += "o";
        break;
      case "ⲡ":
        result += "p";
        break;
      case "ⲣ":
        result += "r";
        break;
      case "ⲥ":
        result += "s";
        break;
      case "ⲧ":
        result += "t";
        break;
      case "ⲩ":
        result += "ee";
        break; // Only reached if not part of digraphs
      case "ⲫ":
        result += "f";
        break;
      case "ⲭ":
        if (nextChar && FRONT_VOWELS.includes(nextChar)) {
          result += "sh";
        } else {
          result += "kh";
        }
        break;
      case "ⲯ":
        result += "ps";
        break;
      case "ⲱ":
        result += "o";
        break;
      case "ϣ":
        result += "sh";
        break;
      case "ϥ":
        result += "f";
        break;
      case "ϧ":
      case "ⳳ":
        result += "kh";
        break;
      case "ϩ":
        result += "h";
        break;
      case "ϫ":
        result += "j";
        break;
      case "ϭ":
        result += "ch";
        break;
      case "ϯ":
        result += "tee";
        break;
      default:
        result += char; // Passthrough spaces, punctuation
    }
    i++;
  }

  // Final cleanup for English TTS pacing
  // Insert hyphen between consecutive vowel sounds to prevent merging (like eeohm -> ee-ohm)
  result = result.replace(/(ee)(o|a|e|u)/gi, "$1-$2");

  return result;
}
