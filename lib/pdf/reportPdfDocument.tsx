// reportPdfDocument.tsx
// React PDF document rendered server-side via @react-pdf/renderer.
// Uses only PDF primitives (View, Text, Image) — no HTML/CSS/Tailwind.
// Imported by app/api/export-pdf/route.ts which calls renderToBuffer().

import React from "react";
import { Document, Page, View, Text, Image, StyleSheet, Font } from "@react-pdf/renderer";
import type { ServiceReport, JobPhoto } from "@/types/report";
import { SERVICE_TYPE_LABELS } from "@/types/report";
import { safeBrandColor } from "@/lib/utils";

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
    paddingBottom: 44,
  },

  // ── Full header (page 1 only) ───────────────────────────────────────────────
  header: {
    paddingHorizontal: 40,
    paddingTop: 18,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 10,
  },
  headerLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "rgba(255,255,255,0.55)",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 5,
  },
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

  // ── Slim bar (page 2+ only) ─────────────────────────────────────────────────
  slimBar: {
    paddingHorizontal: 40,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  slimBarBiz: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    letterSpacing: 0.3,
  },
  slimBarSub: {
    fontSize: 8,
    color: "rgba(255,255,255,0.60)",
  },

  // ── Body ───────────────────────────────────────────────────────────────────
  body: {
    paddingHorizontal: 40,
    paddingTop: 8,
  },

  // ── Info grid ──────────────────────────────────────────────────────────────
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  infoHalf: {
    width: "47%",
    paddingVertical: 5,
    paddingHorizontal: 0,
  },
  infoFull: {
    width: "100%",
    paddingVertical: 3,
  },
  infoLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  infoValue: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    lineHeight: 1.35,
  },
  infoValueSmall: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#374151",
    lineHeight: 1.35,
  },

  // ── Next service highlight ──────────────────────────────────────────────────
  nextServiceBox: {
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    width: "47%",
    borderWidth: 1.5,
  },

  // ── Divider ────────────────────────────────────────────────────────────────
  divider: {
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    marginTop: 7,
    marginBottom: 7,
  },

  // ── Section label ──────────────────────────────────────────────────────────
  sectionLabel: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 6,
  },

  // ── Summary block ──────────────────────────────────────────────────────────
  summaryBlock: {
    backgroundColor: "#f1f5f9",
    borderRadius: 5,
    padding: 12,
    marginTop: 8,
    marginBottom: 2,
    borderLeftWidth: 4,
  },
  summaryLabel: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  summaryText: {
    fontSize: 10.5,
    color: "#374151",
    lineHeight: 1.65,
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

  // ── Thank you ──────────────────────────────────────────────────────────────
  thankYou: {
    fontSize: 14,
    color: "#374151",
    textAlign: "center",
    lineHeight: 1.6,
    marginBottom: 5,
    marginTop: 8,
  },
  thankYouBiz: {
    fontFamily: "Helvetica-Bold",
    color: "#111827",
  },
  thankYouSub: {
    fontSize: 10.5,
    color: "#9ca3af",
    textAlign: "center",
    lineHeight: 1.5,
  },

  // ── Fixed footer (bottom of every page) ───────────────────────────────────
  fixedFooter: {
    position: "absolute",
    bottom: 12,
    left: 40,
    right: 40,
  },
  fixedFooterTop: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 3,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 5,
    marginBottom: 3,
  },
  footerItem: {
    fontSize: 7.5,
    color: "#9ca3af",
  },
  footerSep: {
    fontSize: 7.5,
    color: "#d1d5db",
  },
  pageBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
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

function jobNumber(id: string): string {
  const clean = id.replace(/[^a-zA-Z0-9]/g, "");
  return "JW-" + clean.slice(-6).toUpperCase();
}

// Lighten a hex brand color to ~10% opacity for the next service box background
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export default function ReportPdfDocument({ report, photos = [] }: ReportPdfDocumentProps) {
  const { business, job, report: rpt } = report;
  const brandColor = safeBrandColor(business.brandColor);
  const equipmentStr = job.equipment?.trim() ?? "";
  const nextServiceBg = hexToRgba(brandColor, 0.08);

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

        {/* ── Fixed footer — repeats on every page ─────────────────────── */}
        <View style={s.fixedFooter} fixed>
          <View style={s.fixedFooterTop}>
            {footerItems.map((item, i) => (
              <React.Fragment key={i}>
                {i > 0 && <Text style={s.footerSep}>·</Text>}
                <Text style={s.footerItem}>{item}</Text>
              </React.Fragment>
            ))}
          </View>
          <View style={s.pageBar}>
            <Text style={s.pageBarBrand}>{`Report generated ${new Date().toLocaleDateString("en-CA")}`}</Text>
            <Text
              style={s.pageBarNum}
              render={({ pageNumber, totalPages }) =>
                totalPages > 1 ? `Page ${pageNumber} of ${totalPages}` : ""
              }
            />
          </View>
        </View>

        {/* ── Slim bar — page 2+ only ────────────────────────────────────── */}
        <View
          fixed
          render={({ pageNumber }) =>
            pageNumber > 1 ? (
              <View style={[s.slimBar, { backgroundColor: brandColor }]}>
                <Text style={s.slimBarBiz}>{business.businessName}</Text>
                {Boolean(business.technicianName) && (
                  <Text style={s.slimBarSub}>Technician: {business.technicianName}</Text>
                )}
              </View>
            ) : null
          }
        />

        {/* ── Full header — page 1 only ──────────────────────────────────── */}
        <View style={[s.header, { backgroundColor: brandColor }]} fixed={false}>
          {business.logoUrl && !business.logoUrl.includes("image/svg") && (
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

          {/* Info grid — consistent 2-column layout */}
          <View style={s.infoGrid}>
            {/* Row 1: Customer | Job Number */}
            <View style={s.infoHalf}>
              <Text style={[s.infoLabel, { color: brandColor }]}>Customer</Text>
              <Text style={s.infoValue}>{job.customerName}</Text>
            </View>
            <View style={s.infoHalf}>
              <Text style={[s.infoLabel, { color: brandColor }]}>Job Number</Text>
              <Text style={s.infoValue}>{jobNumber(report.id)}</Text>
            </View>

            {/* Row 2: Date of Service | Service Address */}
            <View style={s.infoHalf}>
              <Text style={[s.infoLabel, { color: brandColor }]}>Date of Service</Text>
              <Text style={s.infoValue}>{formatDate(job.jobDate)}</Text>
            </View>
            {Boolean(job.serviceAddress) ? (
              <View style={s.infoHalf}>
                <Text style={[s.infoLabel, { color: brandColor }]}>Service Address</Text>
                <Text style={s.infoValue}>{job.serviceAddress}</Text>
              </View>
            ) : <View style={s.infoHalf} />}

            {/* Row 3: Service Type | Next Service Due (highlighted) */}
            <View style={s.infoHalf}>
              <Text style={[s.infoLabel, { color: brandColor }]}>Service Type</Text>
              <Text style={s.infoValue}>{SERVICE_TYPE_LABELS[job.serviceType]}</Text>
            </View>
            {Boolean(job.nextServiceDate) ? (
              <View style={[s.nextServiceBox, { backgroundColor: nextServiceBg, borderColor: brandColor }]}>
                <Text style={[s.infoLabel, { color: brandColor }]}>Next Service Due</Text>
                <Text style={[s.infoValue, { color: brandColor }]}>{formatDate(job.nextServiceDate!)}</Text>
              </View>
            ) : <View style={s.infoHalf} />}

            {/* Row 4: Equipment (full width, slightly smaller) */}
            {Boolean(equipmentStr) && (
              <View style={s.infoFull}>
                <Text style={[s.infoLabel, { color: brandColor }]}>Equipment / System</Text>
                <Text style={s.infoValueSmall}>{equipmentStr}</Text>
              </View>
            )}
          </View>

          {/* Summary */}
          {Boolean(rpt.customerSummary) && (
            <View style={[s.summaryBlock, { borderLeftColor: brandColor }]}>
              <Text style={[s.summaryLabel, { color: brandColor }]}>Summary</Text>
              <Text style={s.summaryText}>{rpt.customerSummary}</Text>
            </View>
          )}

          {/* Observations */}
          {Boolean(rpt.findings) && (
            <>
              <Divider />
              <Text style={[s.sectionLabel, { color: brandColor }]}>Observations</Text>
              <BulletList text={rpt.findings} />
            </>
          )}

          {/* Work Performed */}
          {Boolean(rpt.workPerformed) && (
            <>
              <Divider />
              <Text style={[s.sectionLabel, { color: brandColor }]}>Work Performed</Text>
              <BulletList text={rpt.workPerformed} />
            </>
          )}

          {/* Recommendations */}
          {Boolean(rpt.recommendations) && (
            <>
              <Divider />
              <Text style={[s.sectionLabel, { color: brandColor }]}>Recommendations</Text>
              <BulletList text={rpt.recommendations} />
            </>
          )}

          {/* Job Photos + Thank you — photos first, thank you always last */}
          {photos.length > 0 ? (
            <View wrap={false}>
              <Divider />
              <Text style={[s.sectionLabel, { color: brandColor }]}>Job Photos</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 8 }}>
                {photos.map((photo) => (
                  <View key={photo.id} style={{ width: "47%", height: 300, borderRadius: 6, overflow: "hidden" }}>
                    {/* eslint-disable-next-line jsx-a11y/alt-text */}
                    <Image src={photo.dataUrl} style={{ width: "100%", height: 300, objectFit: "cover" }} />
                  </View>
                ))}
              </View>
              <Divider />
              <Text style={s.thankYou}>
                {"Thank you for choosing "}
                <Text style={s.thankYouBiz}>{business.businessName}</Text>
                {"."}
              </Text>
              <Text style={s.thankYouSub}>We appreciate your business and look forward to serving you again.</Text>
            </View>
          ) : (
            <View>
              <Divider />
              <Text style={s.thankYou}>
                {"Thank you for choosing "}
                <Text style={s.thankYouBiz}>{business.businessName}</Text>
                {"."}
              </Text>
              <Text style={s.thankYouSub}>We appreciate your business and look forward to serving you again.</Text>
            </View>
          )}

        </View>
      </Page>
    </Document>
  );
}
