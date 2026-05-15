import { siteConfig } from "@/lib/site";

import type { ReactNode } from "react";

type OpenGraphStat = {
  label: string;
  value: string;
};

type OpenGraphThemeName = "dictionary" | "grammar" | "platform" | "publication";

type OpenGraphGlossMarker = "f" | "m" | "pl";

type OpenGraphHeadingPart = {
  marker: OpenGraphGlossMarker;
  spelling: string;
};

type OpenGraphGenderedGlossRow = {
  values: Array<{
    marker: OpenGraphGlossMarker;
    meaning: string;
  }>;
};

type EntryCardOptions = {
  footerLabel: string;
  genderedGlossRows?: OpenGraphGenderedGlossRow[];
  gloss: string;
  heading: string;
  headingParts?: OpenGraphHeadingPart[];
  partOfSpeech: string;
  partOfSpeechLabel: string;
  strapline: string;
};

type LessonCardOptions = {
  eyebrow: string;
  footerLabel: string;
  lessonLabel: string;
  summary: string;
  stats: OpenGraphStat[];
  title: string;
};

type PublicationCardOptions = {
  eyebrow: string;
  footerLabel: string;
  languageLabel: string;
  statusLabel: string;
  subtitle?: string;
  summary: string;
  title: string;
};

type SiteCardOptions = {
  descriptor: string;
  eyebrow: string;
  footerLabel: string;
  stats: OpenGraphStat[];
  summary: string;
  title: string;
};

const siteDomain = new URL(siteConfig.liveUrl).host;

const CARD_THEMES: Record<
  OpenGraphThemeName,
  {
    background: string;
    brandRail: string;
    overlay: string;
    mutedPillBackground: string;
    panelBackground: string;
    panelBorder: string;
    primaryPillBackground: string;
    primaryPillText: string;
    secondaryPillBackground: string;
    secondaryPillText: string;
    textBody: string;
    textFooter: string;
    textMuted: string;
    textPrimary: string;
  }
> = {
  platform: {
    background: "#f9f8f5",
    brandRail: "linear-gradient(180deg, #ebc17d 0%, #008329 100%)",
    overlay:
      "linear-gradient(90deg, rgba(235, 193, 125, 0.26) 0%, rgba(252, 246, 235, 0.72) 27%, rgba(249, 248, 245, 0) 27%), linear-gradient(180deg, rgba(0, 131, 41, 0.08) 0%, rgba(249, 248, 245, 0) 58%)",
    mutedPillBackground: "rgba(30, 29, 29, 0.07)",
    panelBackground: "rgba(255, 255, 255, 0.84)",
    panelBorder: "1px solid rgba(137, 89, 24, 0.18)",
    primaryPillBackground: "#1e1d1d",
    primaryPillText: "#f9f8f5",
    secondaryPillBackground: "rgba(235, 193, 125, 0.2)",
    secondaryPillText: "#895918",
    textBody: "#4f493f",
    textFooter: "#5e584f",
    textMuted: "#895918",
    textPrimary: "#1e1d1d",
  },
  dictionary: {
    background: "#f9f8f5",
    brandRail: "linear-gradient(180deg, #008329 0%, #ebc17d 100%)",
    overlay:
      "linear-gradient(90deg, rgba(0, 131, 41, 0.12) 0%, rgba(236, 250, 240, 0.64) 24%, rgba(249, 248, 245, 0) 24%), linear-gradient(180deg, rgba(235, 193, 125, 0.13) 0%, rgba(249, 248, 245, 0) 62%)",
    mutedPillBackground: "rgba(30, 29, 29, 0.07)",
    panelBackground: "rgba(255, 255, 255, 0.86)",
    panelBorder: "1px solid rgba(0, 131, 41, 0.2)",
    primaryPillBackground: "#008329",
    primaryPillText: "#ffffff",
    secondaryPillBackground: "rgba(30, 29, 29, 0.07)",
    secondaryPillText: "#3e382f",
    textBody: "#4f493f",
    textFooter: "#5e584f",
    textMuted: "#008329",
    textPrimary: "#1e1d1d",
  },
  grammar: {
    background: "#f9f8f5",
    brandRail: "linear-gradient(180deg, #008329 0%, #4acf73 100%)",
    overlay:
      "linear-gradient(90deg, rgba(0, 131, 41, 0.14) 0%, rgba(236, 250, 240, 0.68) 25%, rgba(249, 248, 245, 0) 25%), linear-gradient(180deg, rgba(235, 193, 125, 0.1) 0%, rgba(249, 248, 245, 0) 58%)",
    mutedPillBackground: "rgba(30, 29, 29, 0.07)",
    panelBackground: "rgba(255, 255, 255, 0.86)",
    panelBorder: "1px solid rgba(0, 131, 41, 0.2)",
    primaryPillBackground: "#008329",
    primaryPillText: "#ffffff",
    secondaryPillBackground: "rgba(235, 193, 125, 0.18)",
    secondaryPillText: "#895918",
    textBody: "#4f493f",
    textFooter: "#5e584f",
    textMuted: "#008329",
    textPrimary: "#1e1d1d",
  },
  publication: {
    background: "#f9f8f5",
    brandRail: "linear-gradient(180deg, #ebc17d 0%, #895918 100%)",
    overlay:
      "linear-gradient(90deg, rgba(235, 193, 125, 0.24) 0%, rgba(252, 246, 235, 0.78) 27%, rgba(249, 248, 245, 0) 27%), linear-gradient(180deg, rgba(0, 131, 41, 0.06) 0%, rgba(249, 248, 245, 0) 60%)",
    mutedPillBackground: "rgba(30, 29, 29, 0.07)",
    panelBackground: "rgba(255, 255, 255, 0.88)",
    panelBorder: "1px solid rgba(137, 89, 24, 0.2)",
    primaryPillBackground: "#895918",
    primaryPillText: "#ffffff",
    secondaryPillBackground: "rgba(235, 193, 125, 0.2)",
    secondaryPillText: "#895918",
    textBody: "#4f493f",
    textFooter: "#5e584f",
    textMuted: "#895918",
    textPrimary: "#1e1d1d",
  },
};

function OpenGraphCardFrame({
  children,
  themeName,
}: {
  children: ReactNode;
  themeName: OpenGraphThemeName;
}) {
  const theme = CARD_THEMES[themeName];

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        background: theme.background,
        color: theme.textPrimary,
        position: "relative",
        overflow: "hidden",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          top: 0,
          width: 20,
          background: theme.brandRail,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: theme.overlay,
        }}
      />
      <div
        style={{
          borderTop: "1px solid rgba(137, 89, 24, 0.22)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          padding: "68px 72px",
          position: "relative",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function OpenGraphPill({
  label,
  themeName,
  tone = "primary",
}: {
  label: string;
  themeName: OpenGraphThemeName;
  tone?: "primary" | "secondary";
}) {
  const theme = CARD_THEMES[themeName];
  const isPrimary = tone === "primary";

  return (
    <div
      style={{
        display: "flex",
        padding: "10px 18px",
        borderRadius: 8,
        background: isPrimary
          ? theme.primaryPillBackground
          : theme.secondaryPillBackground,
        fontSize: 24,
        letterSpacing: isPrimary ? 1.3 : 0.2,
        textTransform: isPrimary ? "uppercase" : "none",
        color: isPrimary ? theme.primaryPillText : theme.secondaryPillText,
      }}
    >
      {label}
    </div>
  );
}

function OpenGraphLinguisticGloss({
  marginLeft = 0,
  marginRight = 0,
  marker,
  size,
}: {
  marginLeft?: number;
  marginRight?: number;
  marker: OpenGraphGlossMarker;
  size: "body" | "heading";
}) {
  const displayMarker = marker.toLocaleUpperCase();

  return (
    <span
      style={{
        display: "flex",
        alignItems: "center",
        alignSelf: "center",
        color: CARD_THEMES.dictionary.textFooter,
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: size === "heading" ? 30 : 22,
        fontVariant: "small-caps",
        fontWeight: 700,
        letterSpacing: 0,
        lineHeight: 1,
        marginLeft,
        marginRight,
        whiteSpace: "nowrap",
      }}
    >
      {displayMarker}
    </span>
  );
}

function OpenGraphEntryHeading({
  heading,
  headingParts = [],
}: {
  heading: string;
  headingParts?: OpenGraphHeadingPart[];
}) {
  const sharedHeadingStyle = {
    display: "flex",
    fontSize: 70,
    lineHeight: 1.05,
    fontWeight: 700,
    letterSpacing: 0,
    fontFamily: "Antinoou",
  } as const;

  if (headingParts.length === 0) {
    return <div style={sharedHeadingStyle}>{heading}</div>;
  }

  return (
    <div
      style={{
        ...sharedHeadingStyle,
        alignItems: "baseline",
        flexWrap: "wrap",
      }}
    >
      {headingParts.map((part) => (
        <span
          key={`${part.spelling}-${part.marker}`}
          style={{
            display: "flex",
            alignItems: "baseline",
            marginBottom: 6,
            marginRight: 18,
          }}
        >
          <span>{part.spelling}</span>
          <OpenGraphLinguisticGloss
            marginLeft={10}
            marker={part.marker}
            size="heading"
          />
        </span>
      ))}
    </div>
  );
}

function OpenGraphEntryGloss({
  genderedGlossRows = [],
  gloss,
}: {
  genderedGlossRows?: OpenGraphGenderedGlossRow[];
  gloss: string;
}) {
  const sharedGlossStyle = {
    display: "flex",
    fontSize: 34,
    lineHeight: 1.25,
    color: CARD_THEMES.dictionary.textBody,
    maxWidth: 920,
  } as const;

  if (genderedGlossRows.length === 0) {
    return <div style={sharedGlossStyle}>{gloss}</div>;
  }

  return (
    <div
      style={{
        ...sharedGlossStyle,
        flexDirection: "column",
        gap: 6,
      }}
    >
      {genderedGlossRows.map((row, rowIndex) => (
        <div
          key={`gendered-gloss-${rowIndex}`}
          style={{
            display: "flex",
            alignItems: "baseline",
            flexWrap: "wrap",
          }}
        >
          {row.values.map((value, valueIndex) => (
            <span
              key={`${value.marker}-${value.meaning}`}
              style={{
                display: "flex",
                alignItems: "baseline",
                marginRight: valueIndex < row.values.length - 1 ? 12 : 0,
              }}
            >
              <OpenGraphLinguisticGloss
                marginRight={7}
                marker={value.marker}
                size="body"
              />
              <span>
                {value.meaning}
                {valueIndex < row.values.length - 1 ? ";" : ""}
              </span>
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

function OpenGraphBanner({
  label,
  themeName,
}: {
  label: string;
  themeName: OpenGraphThemeName;
}) {
  const theme = CARD_THEMES[themeName];

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        padding: "16px 28px",
        borderRadius: 8,
        background: theme.primaryPillBackground,
        border: theme.panelBorder,
        fontSize: 28,
        letterSpacing: 1.5,
        textTransform: "uppercase",
        color: theme.primaryPillText,
      }}
    >
      {label}
    </div>
  );
}

function OpenGraphStatGrid({
  compact = false,
  stats,
  themeName,
}: {
  compact?: boolean;
  stats: OpenGraphStat[];
  themeName: OpenGraphThemeName;
}) {
  const theme = CARD_THEMES[themeName];

  return (
    <div
      style={{
        display: "flex",
        gap: compact ? 14 : 18,
        width: "100%",
      }}
    >
      {stats.map((stat) => (
        <div
          key={`${stat.label}-${stat.value}`}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: compact ? 8 : 10,
            minWidth: 0,
            flex: 1,
            padding: compact ? "16px 18px" : "20px 22px",
            borderRadius: 10,
            background: theme.panelBackground,
            border: theme.panelBorder,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: compact ? 18 : 20,
              textTransform: "uppercase",
              letterSpacing: 1.1,
              color: theme.textMuted,
            }}
          >
            {stat.label}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: compact ? 32 : 36,
              lineHeight: 1.1,
              fontWeight: 700,
              color: theme.textPrimary,
            }}
          >
            {stat.value}
          </div>
        </div>
      ))}
    </div>
  );
}

function OpenGraphFooter({
  left,
  right,
  themeName,
}: {
  left: string;
  right: string;
  themeName: OpenGraphThemeName;
}) {
  const theme = CARD_THEMES[themeName];

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 16,
        width: "100%",
        fontSize: 22,
        color: theme.textFooter,
      }}
    >
      <div style={{ display: "flex" }}>{left}</div>
      <div style={{ display: "flex" }}>{right}</div>
    </div>
  );
}

/**
 * Renders the generic site overview Open Graph card used for the homepage and
 * as the fallback preview when a specific resource cannot be resolved.
 */
export function renderSiteOpenGraphCard({
  descriptor,
  eyebrow,
  footerLabel,
  stats,
  summary,
  title,
}: SiteCardOptions) {
  return (
    <OpenGraphCardFrame themeName="platform">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 30,
          maxWidth: 900,
          width: "100%",
        }}
      >
        <OpenGraphBanner label={eyebrow} themeName="platform" />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 26,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 82,
              lineHeight: 0.98,
              fontWeight: 700,
              letterSpacing: 0,
              color: CARD_THEMES.platform.textPrimary,
              marginTop: 4,
            }}
          >
            {title}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 34,
              lineHeight: 1.2,
              color: CARD_THEMES.platform.textBody,
              maxWidth: 920,
              marginTop: 2,
              marginBottom: 4,
            }}
          >
            {descriptor}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 28,
              lineHeight: 1.35,
              color: CARD_THEMES.platform.textBody,
              maxWidth: 920,
              marginTop: 4,
            }}
          >
            {summary}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 28,
          paddingBottom: 12,
        }}
      >
        <OpenGraphStatGrid compact stats={stats} themeName="platform" />
        <div
          style={{
            display: "flex",
            paddingBottom: 28,
          }}
        >
          <OpenGraphFooter
            left={siteDomain}
            right={footerLabel}
            themeName="platform"
          />
        </div>
      </div>
    </OpenGraphCardFrame>
  );
}

/**
 * Renders the dictionary-entry Open Graph card with gloss and part-of-speech
 * metadata.
 */
export function renderEntryOpenGraphCard({
  footerLabel,
  genderedGlossRows = [],
  gloss,
  heading,
  headingParts = [],
  partOfSpeech,
  partOfSpeechLabel,
  strapline,
}: EntryCardOptions) {
  return (
    <OpenGraphCardFrame themeName="dictionary">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 22,
          maxWidth: 960,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <OpenGraphPill label={strapline} themeName="dictionary" />
          <OpenGraphPill
            label={`${partOfSpeechLabel}: ${partOfSpeech}`}
            themeName="dictionary"
            tone="secondary"
          />
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          <OpenGraphEntryHeading
            heading={heading}
            headingParts={headingParts}
          />
          <OpenGraphEntryGloss
            genderedGlossRows={genderedGlossRows}
            gloss={gloss}
          />
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        <OpenGraphFooter
          left={siteDomain}
          right={footerLabel}
          themeName="dictionary"
        />
      </div>
    </OpenGraphCardFrame>
  );
}

/**
 * Renders the grammar-lesson Open Graph card with lesson metadata and summary
 * statistics.
 */
export function renderLessonOpenGraphCard({
  eyebrow,
  footerLabel,
  lessonLabel,
  summary,
  stats,
  title,
}: LessonCardOptions) {
  return (
    <OpenGraphCardFrame themeName="grammar">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 22,
          maxWidth: 940,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 16,
            alignItems: "center",
          }}
        >
          <OpenGraphPill label={eyebrow} themeName="grammar" />
          <OpenGraphPill
            label={lessonLabel}
            themeName="grammar"
            tone="secondary"
          />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 66,
              lineHeight: 1.04,
              fontWeight: 700,
              letterSpacing: 0,
              color: CARD_THEMES.grammar.textPrimary,
            }}
          >
            {title}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 30,
              lineHeight: 1.3,
              color: CARD_THEMES.grammar.textBody,
              maxWidth: 920,
            }}
          >
            {summary}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 22,
        }}
      >
        <OpenGraphStatGrid stats={stats} themeName="grammar" />
        <OpenGraphFooter
          left={siteDomain}
          right={footerLabel}
          themeName="grammar"
        />
      </div>
    </OpenGraphCardFrame>
  );
}

/**
 * Renders the publication Open Graph card with status, language, subtitle, and
 * summary metadata.
 */
export function renderPublicationOpenGraphCard({
  eyebrow,
  footerLabel,
  languageLabel,
  statusLabel,
  subtitle,
  summary,
  title,
}: PublicationCardOptions) {
  return (
    <OpenGraphCardFrame themeName="publication">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 22,
          maxWidth: 920,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 16,
            alignItems: "center",
          }}
        >
          <OpenGraphPill label={eyebrow} themeName="publication" />
          <OpenGraphPill
            label={statusLabel}
            themeName="publication"
            tone="secondary"
          />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 60,
              lineHeight: 1.05,
              fontWeight: 700,
              letterSpacing: 0,
              color: CARD_THEMES.publication.textPrimary,
            }}
          >
            {title}
          </div>
          {subtitle ? (
            <div
              style={{
                display: "flex",
                fontSize: 28,
                lineHeight: 1.3,
                color: CARD_THEMES.publication.textBody,
              }}
            >
              {subtitle}
            </div>
          ) : null}
          <div
            style={{
              display: "flex",
              fontSize: 28,
              lineHeight: 1.35,
              color: CARD_THEMES.publication.textBody,
              maxWidth: 920,
            }}
          >
            {summary}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 14,
            flexWrap: "wrap",
          }}
        >
          <OpenGraphPill label={languageLabel} themeName="publication" />
        </div>
        <OpenGraphFooter
          left={siteDomain}
          right={footerLabel}
          themeName="publication"
        />
      </div>
    </OpenGraphCardFrame>
  );
}
