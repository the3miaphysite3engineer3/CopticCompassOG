import { DEFAULT_LANGUAGE, isLanguage, type Language } from "@/lib/i18n";

type LengthRange = {
  min?: number;
  max: number;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export function getFormLanguage(formData: FormData, key = "locale"): Language {
  const rawLanguage = normalizeWhitespace(getFormString(formData, key));
  return isLanguage(rawLanguage) ? rawLanguage : DEFAULT_LANGUAGE;
}

export function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function normalizeMultiline(value: string) {
  return value
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function hasLengthInRange(value: string, { min = 0, max }: LengthRange) {
  return value.length >= min && value.length <= max;
}

export function isValidEmail(value: string) {
  return (
    hasLengthInRange(value, { min: 3, max: 254 }) && EMAIL_REGEX.test(value)
  );
}

export function isUuid(value: string) {
  return UUID_REGEX.test(value);
}

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
