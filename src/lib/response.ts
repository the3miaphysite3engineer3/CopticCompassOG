export async function readJsonResponse<T>(response: Response) {
  const text = await response.text();

  return {
    data: safeParseJson<T>(text),
    text,
  };
}

export function safeParseJson<T>(value: string) {
  if (!value.trim()) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function summarizeResponseText(value: string, fallback: string) {
  const normalized = value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) {
    return fallback;
  }

  if (normalized.length <= 220) {
    return normalized;
  }

  return `${normalized.slice(0, 217).trimEnd()}...`;
}
