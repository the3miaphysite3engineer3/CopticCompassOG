import { DEFAULT_LANGUAGE, isLanguage, type Language } from "@/lib/i18n";

type LengthRange = {
  min?: number;
  max: number;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Reads a string field from form data and returns an empty string for missing
 * or non-string values so action validators can stay branch-light.
 */
export function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

/**
 * Reads a locale field from form data and falls back to the app default when
 * the submitted value is missing or unsupported.
 */
export function getFormLanguage(formData: FormData, key = "locale"): Language {
  const rawLanguage = normalizeWhitespace(getFormString(formData, key));
  return isLanguage(rawLanguage) ? rawLanguage : DEFAULT_LANGUAGE;
}

/**
 * Collapses repeated whitespace and trims surrounding spaces for single-line
 * form values.
 */
export function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

/**
 * Normalizes textarea-style input into trimmed paragraphs with Unix newlines
 * and at most one blank line between sections.
 */
export function normalizeMultiline(value: string) {
  return value
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Checks whether a string length falls inside an inclusive min/max range.
 */
export function hasLengthInRange(value: string, { min = 0, max }: LengthRange) {
  return value.length >= min && value.length <= max;
}

/**
 * Performs the repo's lightweight email validation using both length bounds
 * and a simple email-shape regex.
 */
export function isValidEmail(value: string) {
  return (
    hasLengthInRange(value, { min: 3, max: 254 }) && EMAIL_REGEX.test(value)
  );
}

/**
 * Checks whether a string matches the canonical UUID shape accepted by the
 * app's report, submission, and API helpers.
 */
export function isUuid(value: string) {
  return UUID_REGEX.test(value);
}

/**
 * Parses a base-10 integer only when the input is a plain integer string inside
 * the provided bounds. Returns null instead of throwing for malformed input.
 */
export function parseBoundedInteger(
  value: string,
  { min, max }: { min: number; max: number },
) {
  if (!/^-?\d+$/.test(value)) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) {
    return null;
  }

  return parsed;
}
