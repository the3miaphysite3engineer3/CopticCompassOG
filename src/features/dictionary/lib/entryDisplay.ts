import {
  DEFAULT_DICTIONARY_DIALECT_FILTER,
  type DialectFilter,
  type DictionaryDialectCode,
} from "@/features/dictionary/config";
import type { LexicalEntry } from "@/features/dictionary/types";

type DialectEntryTuple = [
  DictionaryDialectCode,
  NonNullable<LexicalEntry["dialects"][DictionaryDialectCode]>,
];

export function formatDialectForms(
  forms: DialectEntryTuple[1],
  headwordFallback: string,
) {
  const parts: string[] = [];
  const absoluteWithVariants = forms.absolute
    ? [forms.absolute, ...(forms.absoluteVariants ?? [])].join(", ")
    : headwordFallback;

  parts.push(absoluteWithVariants);

  const bound: string[] = [];
  if (forms.nominal) bound.push(forms.nominal);
  if (forms.pronominal) bound.push(forms.pronominal);

  if (bound.length > 0) parts.push(bound.join("/"));
  if (forms.stative) parts.push(forms.stative);

  return parts.join(" ");
}

export function getPreferredEntryDialectKey(
  entry: LexicalEntry,
  selectedDialect: DialectFilter = DEFAULT_DICTIONARY_DIALECT_FILTER,
) {
  const dialectKeys = Object.keys(entry.dialects) as DictionaryDialectCode[];
  let primaryDialectKey: DictionaryDialectCode | undefined = "S";

  if (selectedDialect !== "ALL" && entry.dialects[selectedDialect]) {
    primaryDialectKey = selectedDialect;
  } else if (!entry.dialects.S) {
    primaryDialectKey = dialectKeys[0];
  }

  return primaryDialectKey;
}

export function getPreferredEntryDisplaySpelling(
  entry: LexicalEntry,
  selectedDialect: DialectFilter = DEFAULT_DICTIONARY_DIALECT_FILTER,
) {
  const primaryDialectKey = getPreferredEntryDialectKey(entry, selectedDialect);
  const primaryForms = primaryDialectKey
    ? entry.dialects[primaryDialectKey]
    : undefined;

  if (!primaryForms) {
    return entry.headword;
  }

  return formatDialectForms(primaryForms, entry.headword);
}
