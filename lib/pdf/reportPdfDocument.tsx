// reportPdfDocument.tsx
// React PDF document rendered server-side via @react-pdf/renderer.
// Uses only PDF primitives (View, Text, Image) — no HTML/CSS/Tailwind.
// Imported by app/api/export-pdf/route.ts which calls renderToBuffer().

import React from "react";
import { Document, Page, View, Text, Image, StyleSheet, Font } from "@react-pdf/renderer";
import type { ServiceReport, JobPhoto } from "@/types/report";
import { SERVICE_TYPE_LABELS } from "@/types/report";

// Disable automatic hyphenation globally — prevents model numbers like
// "MXZ-AP50VGD outdoor" being broken as "out-door" across lines.
Font.registerHyphenationCallback((word: string) => [word]);

interface ReportPdfDocumentProps {
  report: ServiceReport;
  photos?: JobPhoto[];
}

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

// ── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
    paddingBottom: 36, // space for fixed page-number footer
  },

  // ── Header ─────────────────────────────────────────────────────────────────
  header: {
    paddingHorizontal: 40,
    paddingTop: 18,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  // "SERVICE REPORT" label — small, above the business name
  headerLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "rgba(255,255,255,0.55)",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 5,
  },
  // Business name — the hero element
  headerBiz: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    marginBottom: 3,
  },
  headerTech: {
    fontSize: 11,
    color: "rgba(255,255,255,0.70)",
  },
  headerTagline: {
    fontSize: 9,
    color: "rgba(255,255,255,0.45)",
    marginTop: 4,
    letterSpacing: 0.3,
  },

  // ── Body ───────────────────────────────────────────────────────────────────
  body: {
    paddingHorizontal: 40,
    paddingTop: 12,
  },

  // ── Info grid ──────────────────────────────────────────────────────────────
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  infoHalf: {
    width: "47%",
  },
  infoFull: {
    width: "100%",
  },
  infoLabel: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    lineHeight: 1.4,
  },

  // ── Divider ────────────────────────────────────────────────────────────────
  divider: {
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    marginTop: 8,
    marginBottom: 8,
  },

  // ── Section label ──────────────────────────────────────────────────────────
  sectionLabel: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6,
  },

  // ── Summary block ──────────────────────────────────────────────────────────
  summaryBlock: {
    backgroundColor: "#f8fafc",
    borderRadius: 5,
    padding: 11,
    marginTop: 10,
  },
  summaryText: {
    fontSize: 10.5,
    color: "#374151",
    lineHeight: 1.6,
  },

  // ── Bullet list ────────────────────────────────────────────────────────────
  bulletRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  bulletDot: {
    fontSize: 10,
    color: "#6b7280",
    lineHeight: 1.55,
    width: 12,
    flexShrink: 0,
    textAlign: "center",
  },
  bulletText: {
    fontSize: 10.5,
    color: "#111827",
    lineHeight: 1.55,
    flex: 1,
  },

  // ── Photos ─────────────────────────────────────────────────────────────────
  photosGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 6,
  },
  photoWrap: {
    width: "31%",
    height: 150,
    position: "relative",
  },
  photoImg: {
    width: "100%",
    height: "100%",
    borderRadius: 6,
    objectFit: "cover",
  },
  photoLabelWrap: {
    position: "absolute",
    bottom: 5,
    left: 5,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 99,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  photoLabelText: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
  },

  // ── In-flow footer (thank you + contacts) ──────────────────────────────────
  thankYou: {
    fontSize: 10.5,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 1.55,
    marginBottom: 8,
  },
  thankYouBiz: {
    fontFamily: "Helvetica-Bold",
    color: "#111827",
  },
  footerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 8,
  },
  footerItem: {
    fontSize: 8.5,
    color: "#9ca3af",
  },
  footerSep: {
    fontSize: 8.5,
    color: "#d1d5db",
  },
  generated: {
    fontSize: 7.5,
    color: "#9ca3af",
    textAlign: "center",
    marginTop: 6,
  },

  // ── Fixed page-number bar (bottom of every page) ───────────────────────────
  pageBar: {
    position: "absolute",
    bottom: 12,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pageBarBrand: {
    fontSize: 7.5,
    color: "#d1d5db",
  },
  pageBarNum: {
    fontSize: 7.5,
    color: "#d1d5db",
  },
});

// ── Sub-components ───────────────────────────────────────────────────────────

function BulletList({ text }: { text: string }) {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  return (
    <View>
      {lines.map((line, i) => (
        <View key={i} style={s.bulletRow}>
          <Text style={s.bulletDot}>•</Text>
          <Text style={s.bulletText}>{line.replace(/^[•\-]\s*/, "")}</Text>
        </View>
      ))}
    </View>
  );
}

function Divider() {
  return <View style={s.divider} />;
}

// ── Main document ────────────────────────────────────────────────────────────

export default function ReportPdfDocument({ report, photos = [] }: ReportPdfDocumentProps) {
  const { business, job, report: rpt } = report;
  const brandColor = business.brandColor || "#0f172a";
  const equipmentStr = job.equipment?.trim() ?? "";

  const footerItems = [
    business.businessName,
    business.technicianName ? `Technician: ${business.technicianName}` : null,
    business.licence1Label && business.licence1Number ? `${business.licence1Label}: ${business.licence1Number}` : null,
    business.licence2Label && business.licence2Number ? `${business.licence2Label}: ${business.licence2Number}` : null,
    business.phone || null,
    business.email || null,
    business.website || null,
  ].filter((x): x is string => Boolean(x));

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* ── Fixed page-number bar ─────────────────────────────────────── */}
        <View style={s.pageBar} fixed>
          <Text style={s.pageBarBrand}>JobWrap</Text>
          <Text
            style={s.pageBarNum}
            render={({ pageNumber, totalPages }) =>
              totalPages > 1 ? `Page ${pageNumber} of ${totalPages}` : ""
            }
          />
        </View>

        {/* ── Header ────────────────────────────────────────────────────── */}
        <View style={[s.header, { backgroundColor: brandColor }]}>
          {business.logoUrl && (
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image src={business.logoUrl} style={s.logo} />
          )}
          <View>
            <Text style={s.headerLabel}>Service Report</Text>
            <Text style={s.headerBiz}>{business.businessName}</Text>
            {Boolean(business.technicianName) && (
              <Text style={s.headerTech}>Technician: {business.technicianName}</Text>
            )}
            {Boolean(business.tagline) && (
              <Text style={s.headerTagline}>{business.tagline}</Text>
            )}
          </View>
        </View>

        {/* ── Body ──────────────────────────────────────────────────────── */}
        <View style={s.body}>

          {/* Customer / job info */}
          <View style={s.infoGrid}>
            <View style={s.infoHalf}>
              <Text style={s.infoLabel}>Customer</Text>
              <Text style={s.infoValue}>{job.customerName}</Text>
            </View>

            <View style={s.infoHalf}>
              <Text style={s.infoLabel}>Date of Service</Text>
              <Text style={s.infoValue}>{formatDate(job.jobDate)}</Text>
            </View>

            {Boolean(job.serviceAddress) ? (
              <View style={s.infoHalf}>
                <Text style={s.infoLabel}>Service Address</Text>
                <Text style={s.infoValue}>{job.serviceAddress}</Text>
              </View>
            ) : null}

            <View style={job.serviceAddress ? s.infoHalf : s.infoFull}>
              <Text style={s.infoLabel}>Service Type</Text>
              <Text style={s.infoValue}>{SERVICE_TYPE_LABELS[job.serviceType]}</Text>
            </View>

            {Boolean(equipmentStr) && (
              <View style={s.infoFull}>
                <Text style={s.infoLabel}>Equipment / System</Text>
                <Text style={s.infoValue}>{equipmentStr}</Text>
              </View>
            )}

            {Boolean(job.nextServiceDate) && (
              <View style={s.infoHalf}>
                <Text style={s.infoLabel}>Next Service Due</Text>
                <Text style={s.infoValue}>{formatDate(job.nextServiceDate!)}</Text>
              </View>
            )}
          </View>

          {/* Customer summary */}
          {Boolean(rpt.customerSummary) && (
            <View style={s.summaryBlock}>
              <Text style={s.sectionLabel}>Summary</Text>
              <Text style={s.summaryText}>{rpt.customerSummary}</Text>
            </View>
          )}

          {/* Observations */}
          {Boolean(rpt.findings) && (
            <>
              <Divider />
              <Text style={s.sectionLabel}>Observations</Text>
              <BulletList text={rpt.findings} />
            </>
          )}

          {/* Work Performed */}
          {Boolean(rpt.workPerformed) && (
            <>
              <Divider />
              <Text style={s.sectionLabel}>Work Performed</Text>
              <BulletList text={rpt.workPerformed} />
            </>
          )}

          {/* Recommendations */}
          {Boolean(rpt.recommendations) && (
            <>
              <Divider />
              <Text style={s.sectionLabel}>Recommendations</Text>
              <BulletList text={rpt.recommendations} />
            </>
          )}

          {/* Job Photos */}
          {photos.length > 0 && (
            <>
              <Divider />
              <Text style={s.sectionLabel}>Job Photos</Text>
              <View style={s.photosGrid}>
                {photos.map((photo) => (
                  <View key={photo.id} style={s.photoWrap}>
                    {/* eslint-disable-next-line jsx-a11y/alt-text */}
                    <Image src={photo.dataUrl} style={s.photoImg} />
                    <View style={s.photoLabelWrap}>
                      <Text style={s.photoLabelText}>
                        {photo.label === "before" ? "Before" : "After"}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* In-flow footer */}
          <Divider />

          <Text style={s.thankYou}>
            {"Thank you for choosing "}
            <Text style={s.thankYouBiz}>{business.businessName}</Text>
            {". We appreciate your business and look forward to serving you again."}
          </Text>

          <View style={s.footerRow}>
            {footerItems.map((item, i) => (
              <React.Fragment key={i}>
                {i > 0 && <Text style={s.footerSep}>·</Text>}
                <Text style={s.footerItem}>{item}</Text>
              </React.Fragment>
            ))}
          </View>

          <Text style={s.generated}>
            {`Report generated ${new Date().toLocaleDateString("en-CA")}`}
          </Text>

        </View>
      </Page>
    </Document>
  );
}
