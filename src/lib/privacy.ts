export function redactEmailAddress(email: string | null | undefined) {
  if (!email) {
    return null;
  }

  const normalized = email.trim().toLowerCase();
  const atIndex = normalized.indexOf("@");

  if (atIndex <= 0 || atIndex === normalized.length - 1) {
    return "[redacted email]";
  }

  const localPart = normalized.slice(0, atIndex);
  const domain = normalized.slice(atIndex + 1);
  const visibleLocal =
    localPart.length <= 2 ? localPart.slice(0, 1) : localPart.slice(0, 2);

  return `${visibleLocal}***@${domain}`;
}
