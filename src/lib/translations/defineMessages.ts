type MessageMap = Record<string, string>;

type MessageSlice<EnglishMessages extends MessageMap> = {
  en: EnglishMessages;
  nl: { [Key in keyof EnglishMessages]: string };
};

/**
 * Preserves translation-key parity between English and Dutch message slices
 * while keeping literal key/value inference for callers.
 */
export function defineMessages<const EnglishMessages extends MessageMap>(
  messages: MessageSlice<EnglishMessages>,
) {
  return messages;
}
