import type { EtymologyFilter } from "@/features/analytics/lib/analytics";
import type { AnalyticsDialect } from "@/features/dictionary/config";
import type { LexicalEntry } from "@/features/dictionary/types";

export type AnalyticsDrilldown = {
  predicate: (entry: LexicalEntry) => boolean;
  title: string;
};

export function buildAnalyticsStatDrilldown(options: {
  type: "total" | "uncertain" | "unknown";
  totalTitle: string;
  uncertainTitle: string;
  unknownTitle: string;
}): AnalyticsDrilldown {
  if (options.type === "total") {
    return {
      predicate: () => true,
      title: options.totalTitle,
    };
  }

  if (options.type === "unknown") {
    return {
      title: options.unknownTitle,
      predicate: (entry) =>
        entry.english_meanings
          .join(" ")
          .toLowerCase()
          .includes("meaning unknown"),
    };
  }

  return {
    title: options.uncertainTitle,
    predicate: (entry) =>
      entry.english_meanings
        .join(" ")
        .toLowerCase()
        .includes("meaning uncertain"),
  };
}

export function buildAnalyticsChartDrilldown(options: {
  originalName: string;
  title: string;
  type: "derivation" | "etymology" | "gender" | "pos" | "relations" | "verb";
}): AnalyticsDrilldown {
  const { originalName, title, type } = options;

  let predicate: (entry: LexicalEntry) => boolean = () => true;

  if (type === "pos") {
    predicate = (entry) => {
      if (originalName === "Verbs") return entry.pos === "V";
      if (originalName === "Nouns") return entry.pos === "N";
      if (originalName === "Adjectives") return entry.pos === "ADJ";
      if (originalName === "Adverbs") return entry.pos === "ADV";
      if (originalName === "Conjunctions") return entry.pos === "CONJ";
      if (originalName === "Prepositions") return entry.pos === "PREP";
      return (
        entry.pos === "OTHER" ||
        entry.pos === "INTERJ" ||
        entry.pos === "UNKNOWN"
      );
    };
  } else if (type === "gender") {
    predicate = (entry) => {
      if (entry.pos !== "N") return false;
      if (originalName.startsWith("Masculine")) return entry.gender === "M";
      if (originalName.startsWith("Feminine")) return entry.gender === "F";
      if (originalName.startsWith("Epicene")) return entry.gender === "BOTH";
      return entry.gender === "";
    };
  } else if (type === "etymology") {
    predicate = (entry) =>
      originalName === "analytics.grEtymology"
        ? entry.etymology === "Gr"
        : entry.etymology !== "Gr";
  } else if (type === "derivation") {
    predicate = (entry) => {
      if (entry.pos !== "N") return false;
      const headword = entry.headword.toLowerCase();

      if (originalName === "analytics.prefixAbstract") {
        return headword.startsWith("ⲙⲉⲧ") || headword.startsWith("ⲙⲛⲧ");
      }
      if (originalName === "analytics.prefixAgent") {
        return (
          headword.startsWith("ⲣⲉϥ") ||
          headword.startsWith("ⲣⲉⲙ") ||
          headword.startsWith("ⲣⲙ")
        );
      }
      if (originalName === "analytics.prefixAction") {
        return headword.startsWith("ϫⲓⲛ") || headword.startsWith("ϭⲓⲛ");
      }
      if (originalName === "analytics.prefixPrivative") {
        return headword.startsWith("ⲁⲧ") || headword.startsWith("ⲁⲑ");
      }

      return !(
        headword.startsWith("ⲙⲉⲧ") ||
        headword.startsWith("ⲙⲛⲧ") ||
        headword.startsWith("ⲣⲉϥ") ||
        headword.startsWith("ⲣⲉⲙ") ||
        headword.startsWith("ⲣⲙ") ||
        headword.startsWith("ϫⲓⲛ") ||
        headword.startsWith("ϭⲓⲛ") ||
        headword.startsWith("ⲁⲧ") ||
        headword.startsWith("ⲁⲑ")
      );
    };
  } else if (type === "verb") {
    predicate = (entry) => {
      if (entry.pos !== "V") return false;
      const hasAnyStative = Object.values(entry.dialects).some(
        (dialect) => dialect?.stative,
      );
      return originalName === "analytics.hasStative"
        ? hasAnyStative
        : !hasAnyStative;
    };
  } else if (type === "relations") {
    predicate = (entry) =>
      originalName === "analytics.baseRoots"
        ? !entry.relationType
        : !!entry.relationType;
  }

  return { predicate, title };
}

export function filterAnalyticsEntries(options: {
  dictionary: LexicalEntry[];
  drilldown: AnalyticsDrilldown | null;
  selectedDialect: AnalyticsDialect;
  selectedEtymology: EtymologyFilter;
}) {
  if (!options.drilldown) {
    return [];
  }

  let base = options.dictionary;
  const selectedDialect = options.selectedDialect;
  if (selectedDialect !== "ALL") {
    base = base.filter(
      (entry) => entry.dialects[selectedDialect] !== undefined,
    );
  }
  if (options.selectedEtymology !== "ALL") {
    base = base.filter((entry) =>
      options.selectedEtymology === "Gr"
        ? entry.etymology === "Gr"
        : entry.etymology !== "Gr",
    );
  }

  return base.filter(options.drilldown.predicate);
}
