import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { buildEntryOpenGraphPreview } from "@/features/dictionary/lib/entryOpenGraph";
import {
  getDictionary,
  getDictionaryEntryRelations,
} from "@/features/dictionary/lib/dictionary";
import { isPublicLocale } from "@/lib/locale";
import { siteConfig } from "@/lib/site";

const antinoouFontPromise = readFile(
  join(process.cwd(), "src/fonts/AntinoouFont-1.0.6/Antinoou.ttf"),
);

function renderGenericCard() {
  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        background:
          "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 45%, #dbeafe 100%)",
        color: "#0f172a",
        position: "relative",
        overflow: "hidden",
        fontFamily: "Georgia, serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at top right, rgba(14, 165, 233, 0.18), transparent 34%), radial-gradient(circle at bottom left, rgba(20, 184, 166, 0.14), transparent 30%)",
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          padding: "72px 76px",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div
              style={{
                display: "flex",
                padding: "10px 18px",
                borderRadius: 999,
                background: "rgba(15, 23, 42, 0.08)",
                fontSize: 26,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                color: "#0f766e",
              }}
            >
              Digital Humanities
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
              maxWidth: 840,
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 72,
                lineHeight: 1,
                fontWeight: 700,
                letterSpacing: -2,
              }}
            >
              The Wannes Portfolio
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 34,
                lineHeight: 1.25,
                color: "#334155",
              }}
            >
              Scholarly portfolio, lexical search, analytics, and learning tools
              by {siteConfig.author.name}.
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 18,
            flexWrap: "wrap",
            maxWidth: 950,
          }}
        >
          {[
            `${siteConfig.dictionaryEntryCount.toLocaleString()} entries`,
            "Coptic / English / Greek search",
            "Virtual keyboard",
            "Dictionary analytics",
            "Grammar lessons",
          ].map((label) => (
            <div
              key={label}
              style={{
                display: "flex",
                padding: "14px 20px",
                borderRadius: 18,
                background: "rgba(255, 255, 255, 0.72)",
                border: "1px solid rgba(148, 163, 184, 0.35)",
                fontSize: 28,
                color: "#0f172a",
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function renderEntryCard(id: string, locale: string) {
  const language = isPublicLocale(locale) ? locale : "en";
  const dictionary = getDictionary();
  const entry = dictionary.find((item) => item.id === id);

  if (!entry) {
    return renderGenericCard();
  }

  const { parentEntry, relatedEntries } = getDictionaryEntryRelations(
    entry,
    dictionary,
  );
  const preview = buildEntryOpenGraphPreview({
    entry,
    language,
    parentEntry,
    relatedEntries,
  });
  const relatedLabel = language === "nl" ? "Verwante vormen" : "Related forms";
  const partOfSpeechLabel = language === "nl" ? "Woordsoort" : "Part of speech";

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        background:
          "linear-gradient(135deg, #f8fafc 0%, #ecfeff 42%, #dbeafe 100%)",
        color: "#0f172a",
        position: "relative",
        overflow: "hidden",
        fontFamily: "Georgia, serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at top right, rgba(14, 165, 233, 0.16), transparent 34%), radial-gradient(circle at bottom left, rgba(20, 184, 166, 0.18), transparent 30%)",
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          padding: "68px 72px",
          position: "relative",
        }}
      >
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
            <div
              style={{
                display: "flex",
                padding: "10px 18px",
                borderRadius: 999,
                background: "rgba(14, 116, 144, 0.12)",
                fontSize: 24,
                letterSpacing: 1.4,
                textTransform: "uppercase",
                color: "#0f766e",
              }}
            >
              {preview.strapline}
            </div>
            <div
              style={{
                display: "flex",
                padding: "10px 18px",
                borderRadius: 999,
                background: "rgba(15, 23, 42, 0.08)",
                fontSize: 24,
                color: "#334155",
              }}
            >
              {partOfSpeechLabel}: {entry.pos}
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
                fontSize: 70,
                lineHeight: 1.05,
                fontWeight: 700,
                letterSpacing: -1.6,
                fontFamily: "Antinoou",
              }}
            >
              {preview.heading}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 34,
                lineHeight: 1.25,
                color: "#334155",
                maxWidth: 920,
              }}
            >
              {preview.gloss}
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
          {preview.relatedForms.length > 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: 22,
                  textTransform: "uppercase",
                  letterSpacing: 1.2,
                  color: "#0f766e",
                }}
              >
                {relatedLabel}
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 14,
                  flexWrap: "wrap",
                }}
              >
                {preview.relatedForms.map((form) => (
                  <div
                    key={form}
                    style={{
                      display: "flex",
                      padding: "12px 18px",
                      borderRadius: 18,
                      background: "rgba(255, 255, 255, 0.72)",
                      border: "1px solid rgba(148, 163, 184, 0.35)",
                      fontSize: 28,
                      color: "#0f172a",
                      fontFamily: "Antinoou",
                    }}
                  >
                    {form}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
              fontSize: 24,
              color: "#475569",
            }}
          >
            <div style={{ display: "flex" }}>{siteConfig.liveUrl}</div>
            <div style={{ display: "flex" }}>{siteConfig.author.name}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const id = searchParams.get("id");
  const locale = searchParams.get("locale") ?? "en";
  const antinoouFont = await antinoouFontPromise;

  return new ImageResponse(
    type === "entry" && id ? renderEntryCard(id, locale) : renderGenericCard(),
    {
      fonts: [
        {
          name: "Antinoou",
          data: antinoouFont,
          style: "normal",
          weight: 400,
        },
      ],
      width: 1200,
      height: 630,
    },
  );
}
