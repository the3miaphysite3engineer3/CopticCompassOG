import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";

export async function GET() {
  return new ImageResponse(
    (
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
                Scholarly portfolio, lexical search, analytics, and learning
                tools by {siteConfig.author.name}.
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
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
