export function normalizeDialectKey(dialectKey: string): string {
  const trimmedKey = dialectKey.trim();

  if (trimmedKey === "sA") {
    return "L";
  }

  if (trimmedKey === "Sa" || trimmedKey === "Sf") {
    return trimmedKey;
  }

  return trimmedKey.toUpperCase();
}
