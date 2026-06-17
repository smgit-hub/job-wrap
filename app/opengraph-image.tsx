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
          background: "#0f172a",
          fontFamily: "sans-serif",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Orange glow */}
        <div
          style={{
            position: "absolute",
            top: -100,
            left: -100,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(249,115,22,0.25) 0%, transparent 70%)",
          }}
        />

        {/* Left — logo + tagline + pill */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "0 40px 0 72px",
            gap: 0,
          }}
        >
          {/* Pill badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(249,115,22,0.15)",
              border: "1px solid rgba(249,115,22,0.3)",
              borderRadius: 999,
              padding: "8px 18px",
              marginBottom: 32,
              width: "fit-content",
            }}
          >
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#f97316" }} />
            <span style={{ color: "#fb923c", fontSize: 16, fontWeight: 600, letterSpacing: 0.5 }}>
              Built for HVAC &amp; AC technicians
            </span>
          </div>

          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: "#f97316",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ color: "white", fontSize: 28, fontWeight: 800 }}>J</span>
            </div>
            <span style={{ color: "white", fontSize: 40, fontWeight: 800, letterSpacing: -1 }}>
              JobWrap
            </span>
          </div>

          {/* Tagline */}
          <div
            style={{
              color: "white",
              fontSize: 44,
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: -1,
              marginBottom: 20,
            }}
          >
            Talk through the job.
            <br />
            <span style={{ color: "#f97316" }}>Get the report.</span>
          </div>

          {/* Sub */}
          <div style={{ color: "#94a3b8", fontSize: 20, lineHeight: 1.5, maxWidth: 440 }}>
            AI-powered service reports in seconds — no typing, no paperwork.
          </div>

          {/* CTA pill */}
          <div
            style={{
              marginTop: 36,
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "#f97316",
              borderRadius: 12,
              padding: "14px 28px",
              width: "fit-content",
            }}
          >
            <span style={{ color: "white", fontSize: 18, fontWeight: 700 }}>
              14-day free trial · jobwrap.app
            </span>
          </div>
        </div>

        {/* Right — phone mockup */}
        <div
          style={{
            width: 380,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            paddingRight: 72,
            paddingTop: 40,
            paddingBottom: 40,
          }}
        >
          {/* Phone frame */}
          <div
            style={{
              background: "#1e293b",
              borderRadius: 40,
              padding: 6,
              boxShadow: "0 40px 80px rgba(0,0,0,0.6)",
              display: "flex",
            }}
          >
            {/* Notch */}
            <div style={{ position: "relative", display: "flex" }}>
              <div
                style={{
                  position: "absolute",
                  top: 8,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "30%",
                  height: 10,
                  background: "#1e293b",
                  borderRadius: 999,
                  zIndex: 10,
                }}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={heroUrl}
                alt="JobWrap app"
                width={280}
                height={606}
                style={{ borderRadius: 34, display: "block" }}
              />
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
