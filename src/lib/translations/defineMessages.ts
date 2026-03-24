type MessageMap = Record<string, string>;

type MessageSlice<EnglishMessages extends MessageMap> = {
  en: EnglishMessages;
  nl: { [Key in keyof EnglishMessages]: string };
};

export function defineMessages<const EnglishMessages extends MessageMap>(
  messages: MessageSlice<EnglishMessages>,
) {
  return messages;
}
