// PrintableReport — the source element that gets rasterized into a PDF.
//
// IMPORTANT RENDERING RULES:
//   • This component uses 100% inline styles. No Tailwind classes.
//     html2canvas does not reliably capture Tailwind utility classes because
//     they are purged at build time and may not be present in the captured
//     CSS context. Inline styles are always captured correctly.
//   • No external icon libraries (Lucide, etc.) — SVG rendering in html2canvas
//     is unreliable across browsers. Use Unicode characters or plain shapes.
//   • Fixed width: 794px (A4 portrait at 96 dpi). jsPDF scales this to 210 mm.
//
// TODO (future): support multiple branded templates (compact, photo-first,
// formal letterhead) selectable from BrandingSettings.
// TODO (future): render customer signature block when e-signature is added.
// TODO (future): render a photo grid page when job photos are attached.

import React, { forwardRef } from "react";
import type { ServiceReport, JobPhoto } from "@/types/report";
import { SERVICE_TYPE_LABELS } from "@/types/report";

interface PrintableReportProps {
  report: ServiceReport;
  photos?: JobPhoto[];
}

// ── Shared style tokens ──────────────────────────────────────────────────────
const FONT = "'system-ui', '-apple-system', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif";
const TEXT_PRIMARY = "#111827";
const TEXT_SECONDARY = "#6b7280";
const TEXT_MUTED = "#9ca3af";
const BORDER = "#e5e7eb";
const PAGE_WIDTH = 794; // px — A4 at 96 dpi
const PAD_H = 48; // horizontal padding

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-CA", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

// ── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontFamily: FONT,
        fontSize: 10,
        fontWeight: 600,
        color: TEXT_MUTED,
        textTransform: "uppercase",
        letterSpacing: "0.07em",
        margin: "0 0 6px 0",
      }}
    >
      {children}
    </p>
  );
}

function Divider() {
  return (
    <div
      style={{
        borderTop: `1px solid ${BORDER}`,
        margin: "20px 0",
      }}
    />
  );
}

function BulletList({ text }: { text: string }) {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return null;

  return (
    <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
      {lines.map((line, i) => (
        <li
          key={i}
          style={{
            display: "flex",
            gap: 8,
            marginBottom: i < lines.length - 1 ? 8 : 0,
          }}
        >
          <span
            style={{
              fontFamily: FONT,
              fontSize: 13,
              color: TEXT_MUTED,
              flexShrink: 0,
              lineHeight: "1.6",
            }}
          >
            •
          </span>
          <span
            style={{
              fontFamily: FONT,
              fontSize: 13,
              color: TEXT_PRIMARY,
              lineHeight: "1.6",
            }}
          >
            {line.replace(/^[•\-]\s*/, "")}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Section({
  title,
  children,
  divider = true,
}: {
  title: string;
  children: React.ReactNode;
  divider?: boolean;
}) {
  return (
    <>
      {divider && <Divider />}
      <section style={{ marginBottom: 0 }}>
        <SectionLabel>{title}</SectionLabel>
        {children}
      </section>
    </>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

const PrintableReport = forwardRef<HTMLDivElement, PrintableReportProps>(
  ({ report, photos = [] }, ref) => {
    const { business, job, report: rpt } = report;
    const brandColor = "#0f172a"; // slate-900 — fixed header colour

    return (
      <div
        ref={ref}
        style={{
          width: PAGE_WIDTH,
          backgroundColor: "#ffffff",
          fontFamily: FONT,
          color: TEXT_PRIMARY,
          // Clip to page width — prevent content overflow affecting canvas dimensions
          overflow: "hidden",
        }}
      >
        {/* ── Branded header ──────────────────────────────────────────── */}
        <div
          style={{
            backgroundColor: brandColor,
            padding: `32px ${PAD_H}px 28px`,
          }}
        >
          <h1
            style={{
              fontFamily: FONT,
              fontSize: 22,
              fontWeight: 700,
              color: "#ffffff",
              margin: "0 0 6px 0",
              lineHeight: "1.2",
            }}
          >
            {"Service Report"}
          </h1>
          <p
            style={{
              fontFamily: FONT,
              fontSize: 14,
              color: "rgba(255,255,255,0.85)",
              margin: 0,
            }}
          >
            {business.businessName}
          </p>
          {business.technicianName && (
            <p
              style={{
                fontFamily: FONT,
                fontSize: 13,
                color: "rgba(255,255,255,0.65)",
                margin: "4px 0 0 0",
              }}
            >
              {`Technician: ${business.technicianName}`}
            </p>
          )}
          {business.tagline && (
            <p
              style={{
                fontFamily: FONT,
                fontSize: 11,
                color: "rgba(255,255,255,0.45)",
                margin: "6px 0 0 0",
                letterSpacing: "0.02em",
              }}
            >
              {business.tagline}
            </p>
          )}
        </div>

        {/* ── Report body ─────────────────────────────────────────────── */}
        <div style={{ padding: `28px ${PAD_H}px 36px` }}>
          {/* Customer & job info grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "14px 32px",
            }}
          >
            <div>
              <SectionLabel>Customer</SectionLabel>
              <p
                style={{
                  fontFamily: FONT,
                  fontSize: 14,
                  fontWeight: 600,
                  color: TEXT_PRIMARY,
                  margin: 0,
                }}
              >
                {job.customerName}
              </p>
            </div>

            <div>
              <SectionLabel>Date of Service</SectionLabel>
              <p
                style={{
                  fontFamily: FONT,
                  fontSize: 14,
                  fontWeight: 600,
                  color: TEXT_PRIMARY,
                  margin: 0,
                }}
              >
                {formatDate(job.jobDate)}
              </p>
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <SectionLabel>Service Address</SectionLabel>
              <p
                style={{
                  fontFamily: FONT,
                  fontSize: 14,
                  fontWeight: 600,
                  color: TEXT_PRIMARY,
                  margin: 0,
                }}
              >
                {job.serviceAddress}
              </p>
            </div>

            {job.voiceNotes?.equipmentDetails && (
              <div>
                <SectionLabel>Equipment / System</SectionLabel>
                <p
                  style={{
                    fontFamily: FONT,
                    fontSize: 14,
                    fontWeight: 600,
                    color: TEXT_PRIMARY,
                    margin: 0,
                  }}
                >
                  {job.voiceNotes.equipmentDetails}
                </p>
              </div>
            )}

            <div style={job.voiceNotes?.equipmentDetails ? {} : { gridColumn: "1 / -1" }}>
              <SectionLabel>Service Type</SectionLabel>
              <p
                style={{
                  fontFamily: FONT,
                  fontSize: 14,
                  fontWeight: 600,
                  color: TEXT_PRIMARY,
                  margin: 0,
                }}
              >
                {SERVICE_TYPE_LABELS[job.serviceType]}
              </p>
            </div>
          </div>

          {/* Customer summary */}
          {rpt.customerSummary && (
            <>
              <Divider />
              <section
                style={{
                  backgroundColor: "#f8fafc",
                  borderRadius: 8,
                  padding: "14px 16px",
                  marginBottom: 0,
                }}
              >
                <SectionLabel>Summary</SectionLabel>
                <p
                  style={{
                    fontFamily: FONT,
                    fontSize: 13,
                    color: TEXT_PRIMARY,
                    lineHeight: "1.65",
                    margin: 0,
                  }}
                >
                  {rpt.customerSummary}
                </p>
              </section>
            </>
          )}

          {/* Work Performed */}
          {rpt.workCompleted && (
            <Section title="Work Performed">
              <BulletList text={rpt.workCompleted} />
            </Section>
          )}

          {/* Diagnostics & Findings */}
          {rpt.diagnostics && (
            <Section title="Diagnostics & Findings">
              <BulletList text={rpt.diagnostics} />
            </Section>
          )}

          {/* Recommendations */}
          {rpt.recommendations && (
            <Section title="Recommendations">
              <BulletList text={rpt.recommendations} />
            </Section>
          )}

          {/* Job photos */}
          {photos.length > 0 && (
            <>
              <Divider />
              <section>
                <SectionLabel>Job Photos</SectionLabel>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 10,
                    marginTop: 8,
                  }}
                >
                  {photos.map((photo) => (
                    <div key={photo.id} style={{ position: "relative" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.dataUrl}
                        alt=""
                        style={{
                          width: "100%",
                          aspectRatio: "1",
                          objectFit: "cover",
                          borderRadius: 8,
                          display: "block",
                        }}
                      />
                      <span
                        style={{
                          position: "absolute",
                          bottom: 6,
                          left: 6,
                          padding: "2px 7px",
                          borderRadius: 999,
                          fontSize: 9,
                          fontWeight: 700,
                          fontFamily: FONT,
                          color: "#ffffff",
                          backgroundColor: "rgba(0,0,0,0.55)",
                        }}
                      >
                        {photo.label === "before" ? "Before" : "After"}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          {/* ── Footer ──────────────────────────────────────────────────── */}
          <Divider />

          {/* Thank-you message */}
          <p
            style={{
              fontFamily: FONT,
              fontSize: 13,
              color: TEXT_SECONDARY,
              textAlign: "center",
              margin: "0 0 20px 0",
              lineHeight: "1.5",
            }}
          >
            Thank you for choosing{" "}
            <span style={{ fontWeight: 600, color: TEXT_PRIMARY }}>
              {business.businessName}
            </span>
            . We appreciate your business and look forward to serving you again.
          </p>

          {/* Business details row */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: "4px 20px",
              paddingTop: 16,
              borderTop: `1px solid ${BORDER}`,
            }}
          >
            {[
              business.businessName,
              business.technicianName && `Technician: ${business.technicianName}`,
              business.licenseNumber && `Licence: ${business.licenseNumber}`,
              business.phone,
              business.email,
              business.website,
            ]
              .filter(Boolean)
              .map((item, i) => (
                <span
                  key={i}
                  style={{
                    fontFamily: FONT,
                    fontSize: 11,
                    color: TEXT_MUTED,
                  }}
                >
                  {item}
                </span>
              ))}
          </div>

          {/* Report ID + date generated */}
          <p
            style={{
              fontFamily: FONT,
              fontSize: 10,
              color: TEXT_MUTED,
              textAlign: "center",
              margin: "12px 0 0 0",
            }}
          >
            Report generated {new Date().toLocaleDateString("en-CA")} · JobWrap
          </p>
        </div>
      </div>
    );
  }
);

PrintableReport.displayName = "PrintableReport";
export default PrintableReport;
