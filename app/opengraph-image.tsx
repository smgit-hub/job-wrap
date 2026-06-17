import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "JobWrap — AI Service Reports for HVAC Technicians";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f172a",
          fontFamily: "sans-serif",
          gap: 0,
        }}
      >
        {/* Logo row */}
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 32 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              background: "#f97316",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ color: "white", fontSize: 38, fontWeight: 800 }}>J</span>
          </div>
          <span style={{ color: "white", fontSize: 52, fontWeight: 800 }}>JobWrap</span>
        </div>

        {/* Tagline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            marginBottom: 28,
          }}
        >
          <span style={{ color: "white", fontSize: 54, fontWeight: 800 }}>
            Talk through the job.
          </span>
          <span style={{ color: "#f97316", fontSize: 54, fontWeight: 800 }}>
            Get the report.
          </span>
        </div>

        {/* Sub */}
        <div style={{ color: "#94a3b8", fontSize: 24, marginBottom: 40 }}>
          AI-powered service reports for HVAC technicians — in seconds.
        </div>

        {/* CTA pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            background: "#f97316",
            borderRadius: 14,
            padding: "16px 32px",
          }}
        >
          <span style={{ color: "white", fontSize: 22, fontWeight: 700 }}>
            14-day free trial · no credit card · jobwrap.app
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
