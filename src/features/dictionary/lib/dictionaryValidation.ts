import {
  DICTIONARY_DIALECT_CODES,
  DICTIONARY_SENSE_CODES,
  PARTS_OF_SPEECH,
} from "../config.ts";

type DictionaryValidationIssue = {
  message: string;
  path: string;
  value?: unknown;
};

type DictionaryValidationResult = {
  issues: DictionaryValidationIssue[];
  valid: boolean;
};

const allowedTopLevelEntryFields = new Set([
  "dialectMeanings",
  "dialects",
  "etym",
  "genderedMeanings",
  "greek",
  "headword",
  "id",
  "inflections",
  "root_id",
  "senses",
]);
const deprecatedTopLevelEntryFields = new Set([
  "dutch_meanings",
  "english_meanings",
  "gender",
  "meaningGroups",
  "parentEntryId",
  "pluralForms",
  "pos",
  "relationType",
]);
const allowedEtymologies = new Set(["Egy", "Gr", "Unknown"]);
const allowedDialectCodes = new Set<string>(DICTIONARY_DIALECT_CODES);
const allowedDialectFormFields = new Set([
  "absolute",
  "nominal",
  "participles",
  "pronominal",
  "stative",
  "variants",
]);
const allowedDialectVariantFields = new Set([
  "absolute",
  "constructParticiples",
  "nominal",
  "pronominal",
  "stative",
]);
const allowedSenseGrammarKeys = new Set([
  "affix",
  "caseRole",
  "derivation",
  "form",
  "gender",
  "mood",
  "number",
  "polarity",
  "pos",
  "tags",
  "valency",
  "voice",
]);
const allowedSenseGrammarPartOfSpeech = new Set([...PARTS_OF_SPEECH, "PRON"]);
const allowedSenseGrammarTags = new Set<string>(DICTIONARY_SENSE_CODES);
const senseGrammarEnumFields = {
  affix: ["PFX", "SFX"],
  caseRole: ["DAT", "OBJ"],
  derivation: ["CAUS"],
  form: ["ABS", "PC", "STA", "VBAL"],
  gender: ["BOTH", "F", "M"],
  mood: ["IMP"],
  number: ["PL", "SG"],
  polarity: ["NEG"],
  valency: ["INTR", "TR"],
  voice: ["REFL"],
} as const;
const localizedArrayFields = new Set(["en", "nl"]);
const allowedGenderedMeaningMarkers = new Set(["f", "m", "pl"]);
const allowedInflectionKinds = new Set([
  "dual",
  "feminine",
  "imperative",
  "masculine",
  "plural",
]);
const allowedInflectionRoles = new Set([
  "absolute",
  "default",
  "nominal",
  "pronominal",
]);

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value);
}

function describeValue(value: unknown) {
  if (value === undefined) {
    return "";
  }

  try {
    return `: ${JSON.stringify(value)}`;
  } catch {
    return "";
  }
}

function addIssue(
  issues: DictionaryValidationIssue[],
  path: string,
  message: string,
  value?: unknown,
) {
  issues.push({ message, path, ...(value !== undefined ? { value } : {}) });
}

function validateNonEmptyString(
  issues: DictionaryValidationIssue[],
  value: unknown,
  path: string,
) {
  if (!isNonEmptyString(value)) {
    addIssue(issues, path, "expected a non-empty string", value);
  }
}

function validateNonEmptyStringArray(
  issues: DictionaryValidationIssue[],
  value: unknown,
  path: string,
) {
  if (!Array.isArray(value) || value.length === 0) {
    addIssue(issues, path, "expected a non-empty string array", value);
    return;
  }

  for (const [index, item] of value.entries()) {
    validateNonEmptyString(issues, item, `${path}[${index}]`);
  }
}

function validateLocalizedStringArrays(
  issues: DictionaryValidationIssue[],
  value: unknown,
  path: string,
) {
  if (!isPlainRecord(value)) {
    addIssue(issues, path, "expected a localized string-array object", value);
    return;
  }

  const entries = Object.entries(value);

  if (entries.length === 0) {
    addIssue(issues, path, "expected at least one locale", value);
  }

  for (const [locale, localizedValue] of entries) {
    if (!localizedArrayFields.has(locale)) {
      addIssue(
        issues,
        `${path}.${locale}`,
        "unexpected locale",
        localizedValue,
      );
      continue;
    }

    validateNonEmptyStringArray(issues, localizedValue, `${path}.${locale}`);
  }
}

function validateOptionalLocalizedStringArrays(
  issues: DictionaryValidationIssue[],
  value: unknown,
  path: string,
) {
  if (value !== undefined) {
    validateLocalizedStringArrays(issues, value, path);
  }
}

function validateDialectForms(
  issues: DictionaryValidationIssue[],
  value: unknown,
  path: string,
) {
  if (!isPlainRecord(value)) {
    addIssue(issues, path, "expected a dialect forms object", value);
    return;
  }

  let visibleFormCount = 0;

  for (const [field, fieldValue] of Object.entries(value)) {
    if (!allowedDialectFormFields.has(field)) {
      addIssue(issues, `${path}.${field}`, "unexpected dialect form field");
      continue;
    }

    if (field === "participles") {
      validateNonEmptyStringArray(issues, fieldValue, `${path}.${field}`);
      visibleFormCount += Array.isArray(fieldValue) ? fieldValue.length : 0;
      continue;
    }

    if (field === "variants") {
      validateDialectVariants(issues, fieldValue, `${path}.variants`);
      if (isPlainRecord(fieldValue)) {
        visibleFormCount += Object.values(fieldValue).reduce<number>(
          (count, variantValue) =>
            count + (Array.isArray(variantValue) ? variantValue.length : 0),
          0,
        );
      }
      continue;
    }

    validateNonEmptyString(issues, fieldValue, `${path}.${field}`);
    visibleFormCount += isNonEmptyString(fieldValue) ? 1 : 0;
  }

  if (visibleFormCount === 0) {
    addIssue(issues, path, "expected at least one dialect form");
  }
}

function validateDialectVariants(
  issues: DictionaryValidationIssue[],
  value: unknown,
  path: string,
) {
  if (!isPlainRecord(value)) {
    addIssue(issues, path, "expected a variants object", value);
    return;
  }

  if (Object.keys(value).length === 0) {
    addIssue(issues, path, "expected at least one variant field", value);
  }

  for (const [field, fieldValue] of Object.entries(value)) {
    if (!allowedDialectVariantFields.has(field)) {
      addIssue(issues, `${path}.${field}`, "unexpected variant field");
      continue;
    }

    validateNonEmptyStringArray(issues, fieldValue, `${path}.${field}`);
  }
}

function validateSenseGrammar(
  issues: DictionaryValidationIssue[],
  value: unknown,
  path: string,
) {
  if (!isPlainRecord(value)) {
    addIssue(issues, path, "expected a sense grammar object", value);
    return;
  }

  if (!("pos" in value)) {
    addIssue(issues, `${path}.pos`, "expected a part-of-speech code");
  }

  for (const [field, fieldValue] of Object.entries(value)) {
    if (!allowedSenseGrammarKeys.has(field)) {
      addIssue(issues, `${path}.${field}`, "unexpected grammar field");
      continue;
    }

    if (field === "pos") {
      if (
        typeof fieldValue !== "string" ||
        !allowedSenseGrammarPartOfSpeech.has(fieldValue)
      ) {
        addIssue(
          issues,
          `${path}.pos`,
          "expected a supported part-of-speech code",
          fieldValue,
        );
      }
      continue;
    }

    if (field === "tags") {
      if (!Array.isArray(fieldValue) || fieldValue.length === 0) {
        addIssue(issues, `${path}.tags`, "expected a non-empty tag array");
        continue;
      }

      for (const [index, tag] of fieldValue.entries()) {
        if (typeof tag !== "string" || !allowedSenseGrammarTags.has(tag)) {
          addIssue(
            issues,
            `${path}.tags[${index}]`,
            "expected a supported grammar tag",
            tag,
          );
        }
      }
      continue;
    }

    if (
      field in senseGrammarEnumFields &&
      !senseGrammarEnumFields[
        field as keyof typeof senseGrammarEnumFields
      ].includes(fieldValue as never)
    ) {
      addIssue(
        issues,
        `${path}.${field}`,
        "expected a supported grammar value",
        fieldValue,
      );
    }
  }

  if (value.gender !== undefined && value.pos !== "N") {
    addIssue(issues, `${path}.gender`, "gender is only valid on noun senses");
  }

  if (
    (value.valency !== undefined ||
      value.mood !== undefined ||
      value.voice !== undefined ||
      value.derivation !== undefined ||
      value.form === "PC" ||
      value.form === "STA") &&
    value.pos !== "V"
  ) {
    addIssue(
      issues,
      path,
      "verbal grammar fields are only valid on verb senses",
      value,
    );
  }
}

function validateSense(
  issues: DictionaryValidationIssue[],
  value: unknown,
  path: string,
) {
  if (!isPlainRecord(value)) {
    addIssue(issues, path, "expected a sense object", value);
    return;
  }

  for (const field of Object.keys(value)) {
    if (!["grammar", "meanings", "notes"].includes(field)) {
      addIssue(issues, `${path}.${field}`, "unexpected sense field");
    }
  }

  validateSenseGrammar(issues, value.grammar, `${path}.grammar`);
  validateOptionalLocalizedStringArrays(
    issues,
    value.meanings,
    `${path}.meanings`,
  );
  validateOptionalLocalizedStringArrays(issues, value.notes, `${path}.notes`);
}

function validateDialectMeaning(
  issues: DictionaryValidationIssue[],
  value: unknown,
  path: string,
) {
  if (!isPlainRecord(value)) {
    addIssue(issues, path, "expected a dialect meaning object", value);
    return;
  }

  for (const field of Object.keys(value)) {
    if (!["dialects", "meanings", "notes", "sourceLabel"].includes(field)) {
      addIssue(issues, `${path}.${field}`, "unexpected dialect meaning field");
    }
  }

  validateNonEmptyString(issues, value.sourceLabel, `${path}.sourceLabel`);

  if (!Array.isArray(value.dialects) || value.dialects.length === 0) {
    addIssue(issues, `${path}.dialects`, "expected a non-empty dialect array");
  } else {
    for (const [index, dialect] of value.dialects.entries()) {
      if (typeof dialect !== "string" || !allowedDialectCodes.has(dialect)) {
        addIssue(
          issues,
          `${path}.dialects[${index}]`,
          "expected a supported dialect code",
          dialect,
        );
      }
    }
  }

  validateOptionalLocalizedStringArrays(
    issues,
    value.meanings,
    `${path}.meanings`,
  );
  validateOptionalLocalizedStringArrays(issues, value.notes, `${path}.notes`);
}

function validateGenderedMeaningValues(
  issues: DictionaryValidationIssue[],
  value: unknown,
  path: string,
) {
  if (!isPlainRecord(value)) {
    addIssue(issues, path, "expected a gendered meaning values object", value);
    return;
  }

  if (Object.keys(value).length === 0) {
    addIssue(issues, path, "expected at least one gendered meaning marker");
  }

  for (const [marker, meaning] of Object.entries(value)) {
    if (!allowedGenderedMeaningMarkers.has(marker)) {
      addIssue(
        issues,
        `${path}.${marker}`,
        "unexpected gendered meaning marker",
      );
      continue;
    }

    validateNonEmptyString(issues, meaning, `${path}.${marker}`);
  }
}

function validateGenderedMeaning(
  issues: DictionaryValidationIssue[],
  value: unknown,
  path: string,
) {
  if (!isPlainRecord(value)) {
    addIssue(issues, path, "expected a gendered meaning object", value);
    return;
  }

  for (const field of Object.keys(value)) {
    if (field !== "meanings") {
      addIssue(issues, `${path}.${field}`, "unexpected gendered meaning field");
    }
  }

  if (!isPlainRecord(value.meanings)) {
    addIssue(
      issues,
      `${path}.meanings`,
      "expected localized gendered meanings",
    );
    return;
  }

  for (const [locale, localizedValue] of Object.entries(value.meanings)) {
    if (!localizedArrayFields.has(locale)) {
      addIssue(issues, `${path}.meanings.${locale}`, "unexpected locale");
      continue;
    }

    validateGenderedMeaningValues(
      issues,
      localizedValue,
      `${path}.meanings.${locale}`,
    );
  }
}

function validateInflectedFormValue(
  issues: DictionaryValidationIssue[],
  value: unknown,
  path: string,
  entryIdRefs: Array<{ path: string; value: number }>,
) {
  if (typeof value === "string") {
    validateNonEmptyString(issues, value, path);
    return;
  }

  if (!isPlainRecord(value)) {
    addIssue(
      issues,
      path,
      "expected an inflected form string or object",
      value,
    );
    return;
  }

  for (const field of Object.keys(value)) {
    if (!["entryId", "form", "notes", "uncertain"].includes(field)) {
      addIssue(issues, `${path}.${field}`, "unexpected inflected form field");
    }
  }

  validateNonEmptyString(issues, value.form, `${path}.form`);

  if (value.entryId !== undefined) {
    if (!isInteger(value.entryId)) {
      addIssue(issues, `${path}.entryId`, "expected an integer entry id");
    } else {
      entryIdRefs.push({ path: `${path}.entryId`, value: value.entryId });
    }
  }

  if (value.notes !== undefined) {
    validateNonEmptyStringArray(issues, value.notes, `${path}.notes`);
  }

  if (value.uncertain !== undefined && typeof value.uncertain !== "boolean") {
    addIssue(
      issues,
      `${path}.uncertain`,
      "expected a boolean",
      value.uncertain,
    );
  }
}

function validateInflections(
  issues: DictionaryValidationIssue[],
  value: unknown,
  path: string,
  entryIdRefs: Array<{ path: string; value: number }>,
) {
  if (!isPlainRecord(value)) {
    addIssue(issues, path, "expected an inflections object", value);
    return;
  }

  for (const [kind, dialects] of Object.entries(value)) {
    if (!allowedInflectionKinds.has(kind)) {
      addIssue(issues, `${path}.${kind}`, "unexpected inflection kind");
      continue;
    }

    if (!isPlainRecord(dialects)) {
      addIssue(issues, `${path}.${kind}`, "expected a dialect map", dialects);
      continue;
    }

    for (const [dialect, roles] of Object.entries(dialects)) {
      if (!allowedDialectCodes.has(dialect)) {
        addIssue(
          issues,
          `${path}.${kind}.${dialect}`,
          "expected a supported dialect code",
        );
        continue;
      }

      if (!isPlainRecord(roles)) {
        addIssue(
          issues,
          `${path}.${kind}.${dialect}`,
          "expected an inflection role map",
          roles,
        );
        continue;
      }

      for (const [role, forms] of Object.entries(roles)) {
        if (!allowedInflectionRoles.has(role)) {
          addIssue(
            issues,
            `${path}.${kind}.${dialect}.${role}`,
            "unexpected inflection role",
          );
          continue;
        }

        if (!Array.isArray(forms) || forms.length === 0) {
          addIssue(
            issues,
            `${path}.${kind}.${dialect}.${role}`,
            "expected a non-empty inflected form array",
            forms,
          );
          continue;
        }

        for (const [index, form] of forms.entries()) {
          validateInflectedFormValue(
            issues,
            form,
            `${path}.${kind}.${dialect}.${role}[${index}]`,
            entryIdRefs,
          );
        }
      }
    }
  }
}

function validateEntry(
  issues: DictionaryValidationIssue[],
  value: unknown,
  path: string,
  rootIdRefs: Array<{ path: string; value: number }>,
  entryIdRefs: Array<{ path: string; value: number }>,
) {
  if (!isPlainRecord(value)) {
    addIssue(issues, path, "expected a dictionary entry object", value);
    return;
  }

  for (const field of Object.keys(value)) {
    if (deprecatedTopLevelEntryFields.has(field)) {
      addIssue(
        issues,
        `${path}.${field}`,
        "deprecated entry field is not allowed",
      );
      continue;
    }

    if (!allowedTopLevelEntryFields.has(field)) {
      addIssue(issues, `${path}.${field}`, "unexpected entry field");
    }
  }

  if (!isInteger(value.id)) {
    addIssue(issues, `${path}.id`, "expected an integer entry id", value.id);
  }

  validateNonEmptyString(issues, value.headword, `${path}.headword`);

  if (value.root_id !== undefined) {
    if (!isInteger(value.root_id)) {
      addIssue(
        issues,
        `${path}.root_id`,
        "expected an integer root entry id",
        value.root_id,
      );
    } else {
      rootIdRefs.push({ path: `${path}.root_id`, value: value.root_id });
    }
  }

  if (!isPlainRecord(value.dialects)) {
    addIssue(
      issues,
      `${path}.dialects`,
      "expected a dialect map",
      value.dialects,
    );
  } else if (
    Object.keys(value.dialects).length === 0 &&
    value.inflections !== undefined
  ) {
    addIssue(
      issues,
      `${path}.dialects`,
      "entries with structured inflections should expose dialect forms",
    );
  } else {
    for (const [dialect, forms] of Object.entries(value.dialects)) {
      if (!allowedDialectCodes.has(dialect)) {
        addIssue(
          issues,
          `${path}.dialects.${dialect}`,
          "expected a supported dialect code",
        );
        continue;
      }

      validateDialectForms(issues, forms, `${path}.dialects.${dialect}`);
    }
  }

  if (!Array.isArray(value.senses) || value.senses.length === 0) {
    addIssue(issues, `${path}.senses`, "expected a non-empty senses array");
  } else {
    for (const [index, sense] of value.senses.entries()) {
      validateSense(issues, sense, `${path}.senses[${index}]`);
    }
  }

  if (typeof value.etym !== "string" || !allowedEtymologies.has(value.etym)) {
    addIssue(
      issues,
      `${path}.etym`,
      "expected a supported etymology",
      value.etym,
    );
  }

  if (value.greek !== undefined) {
    validateNonEmptyStringArray(issues, value.greek, `${path}.greek`);
  }

  if (value.dialectMeanings !== undefined) {
    if (!Array.isArray(value.dialectMeanings)) {
      addIssue(
        issues,
        `${path}.dialectMeanings`,
        "expected a dialect meanings array",
      );
    } else {
      for (const [index, dialectMeaning] of value.dialectMeanings.entries()) {
        validateDialectMeaning(
          issues,
          dialectMeaning,
          `${path}.dialectMeanings[${index}]`,
        );
      }
    }
  }

  if (value.genderedMeanings !== undefined) {
    if (!Array.isArray(value.genderedMeanings)) {
      addIssue(
        issues,
        `${path}.genderedMeanings`,
        "expected a gendered meanings array",
      );
    } else {
      for (const [index, genderedMeaning] of value.genderedMeanings.entries()) {
        validateGenderedMeaning(
          issues,
          genderedMeaning,
          `${path}.genderedMeanings[${index}]`,
        );
      }
    }
  }

  if (value.inflections !== undefined) {
    validateInflections(
      issues,
      value.inflections,
      `${path}.inflections`,
      entryIdRefs,
    );
  }
}

export function validateDictionaryEntries(
  payload: unknown,
): DictionaryValidationResult {
  const issues: DictionaryValidationIssue[] = [];
  const rootIdRefs: Array<{ path: string; value: number }> = [];
  const entryIdRefs: Array<{ path: string; value: number }> = [];

  if (!Array.isArray(payload)) {
    addIssue(
      issues,
      "$",
      "expected dictionary payload to be an array",
      payload,
    );
    return { issues, valid: false };
  }

  const entryIds = new Set<number>();

  for (const [index, entry] of payload.entries()) {
    if (isPlainRecord(entry) && isInteger(entry.id)) {
      if (entryIds.has(entry.id)) {
        addIssue(issues, `$[${index}].id`, "entry id must be unique", entry.id);
      }

      entryIds.add(entry.id);
    }

    validateEntry(issues, entry, `$[${index}]`, rootIdRefs, entryIdRefs);
  }

  for (const ref of rootIdRefs) {
    if (!entryIds.has(ref.value)) {
      addIssue(issues, ref.path, "root_id must reference an existing entry id");
    }
  }

  for (const ref of entryIdRefs) {
    if (!entryIds.has(ref.value)) {
      addIssue(
        issues,
        ref.path,
        "inflected form entryId must reference an existing entry id",
      );
    }
  }

  return { issues, valid: issues.length === 0 };
}

export function formatDictionaryValidationIssues(
  issues: readonly DictionaryValidationIssue[],
  limit = 50,
) {
  return issues.slice(0, limit).map((issue) => {
    const suffix = describeValue(issue.value);

    return `${issue.path}: ${issue.message}${suffix}`;
  });
}
