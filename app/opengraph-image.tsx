import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "JobWrap — AI Service Reports for HVAC Technicians";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  const heroUrl = new URL("/screenshots/hero.png", "https://jobwrap.app").toString();

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "row",
          background: "#0f172a",
          fontFamily: "sans-serif",
        }}
      >
        {/* Left panel */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "0 40px 0 72px",
          }}
        >
          {/* Pill badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(249,115,22,0.15)",
              border: "1px solid rgba(249,115,22,0.35)",
              borderRadius: 999,
              padding: "8px 18px",
              marginBottom: 28,
              width: "fit-content",
            }}
          >
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#f97316" }} />
            <span style={{ color: "#fb923c", fontSize: 16, fontWeight: 600 }}>
              Built for HVAC & AC technicians
            </span>
          </div>

          {/* Logo row */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 12,
                background: "#f97316",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ color: "white", fontSize: 26, fontWeight: 800 }}>J</span>
            </div>
            <span style={{ color: "white", fontSize: 36, fontWeight: 800 }}>JobWrap</span>
          </div>

          {/* Tagline */}
          <div
            style={{
              color: "white",
              fontSize: 46,
              fontWeight: 800,
              lineHeight: 1.15,
              marginBottom: 18,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span>Talk through the job.</span>
            <span style={{ color: "#f97316" }}>Get the report.</span>
          </div>

          {/* Sub */}
          <div style={{ color: "#94a3b8", fontSize: 20, lineHeight: 1.5 }}>
            AI-powered service reports in seconds — no typing, no paperwork.
          </div>

          {/* CTA */}
          <div
            style={{
              marginTop: 32,
              display: "flex",
              alignItems: "center",
              background: "#f97316",
              borderRadius: 12,
              padding: "14px 24px",
              width: "fit-content",
            }}
          >
            <span style={{ color: "white", fontSize: 18, fontWeight: 700 }}>
              14-day free trial · jobwrap.app
            </span>
          </div>
        </div>

        {/* Right panel — phone */}
        <div
          style={{
            width: 340,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            paddingRight: 60,
          }}
        >
          <div
            style={{
              background: "#1e293b",
              borderRadius: 40,
              padding: 6,
              display: "flex",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroUrl}
              width={240}
              height={520}
              style={{ borderRadius: 34, display: "block" }}
            />
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
