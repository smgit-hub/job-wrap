// POST /api/export-pdf
// Accepts { report: ServiceReport, photos: JobPhoto[] } JSON.
// Returns a binary PDF stream generated server-side via @react-pdf/renderer.
// Running in Node.js runtime — @react-pdf/renderer is in serverExternalPackages.
//
// TODO(security): this endpoint has no authentication check — any caller can
// generate a PDF using arbitrary report data. Before public launch, validate
// that the report belongs to the authenticated user (via Supabase session).

import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import type { DocumentProps } from "@react-pdf/renderer";
import ReportPdfDocument from "@/lib/pdf/reportPdfDocument";
import type { ServiceReport, JobPhoto } from "@/types/report";

function generateFilename(customerName: string, jobDate: string): string {
  // Normalise customer name: strip non-alphanum chars, collapse whitespace to spaces
  const name = (customerName || "Report")
    .trim()
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Format date as DD Mon YYYY (e.g. 24 May 2026) — readable in a file browser
  let dateLabel = jobDate;
  try {
    dateLabel = new Date(jobDate).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }); // → "24 May 2026"
  } catch {
    // keep raw date string as fallback
  }

  return `Service Report - ${name} - ${dateLabel}.pdf`;
}

// Basic guard: verify the incoming body looks like a ServiceReport
// before passing it to the PDF renderer.
function isValidReportPayload(body: unknown): body is { report: ServiceReport; photos?: JobPhoto[] } {
  if (typeof body !== "object" || body === null) return false;
  const b = body as Record<string, unknown>;
  if (typeof b.report !== "object" || b.report === null) return false;
  const r = b.report as Record<string, unknown>;
  return (
    typeof r.id === "string" &&
    typeof r.job === "object" && r.job !== null &&
    typeof r.report === "object" && r.report !== null
  );
}

export async function POST(request: Request) {
  let parsedBody: unknown;
  try {
    parsedBody = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!isValidReportPayload(parsedBody)) {
    return Response.json({ error: "Invalid report data" }, { status: 400 });
  }

  const { report, photos = [] } = parsedBody;

  try {
    const buffer = await renderToBuffer(
      React.createElement(ReportPdfDocument, { report, photos }) as React.ReactElement<DocumentProps>
    );

    const filename = generateFilename(report.job.customerName, report.job.jobDate);
    // Buffer extends Uint8Array — cast via unknown for the Web Response API
    const body = new Uint8Array(buffer);

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        // "inline" opens in browser PDF viewer; change to "attachment" to force download
        "Content-Disposition": `inline; filename="${filename}"`,
        "Content-Length": body.byteLength.toString(),
      },
    });
  } catch (err) {
    console.error("[export-pdf]", err);
    return Response.json(
      { error: "PDF generation failed" },
      { status: 500 }
    );
  }
}
