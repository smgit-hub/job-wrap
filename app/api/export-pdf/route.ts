// POST /api/export-pdf
// Accepts { report: ServiceReport, photos: JobPhoto[] } JSON.
// Returns a binary PDF stream generated server-side via @react-pdf/renderer.
// Running in Node.js runtime — @react-pdf/renderer is in serverExternalPackages.

// Maximum accepted request body size (10 MB) to prevent OOM on the server.
// A typical report + 6 base64 JPEG photos is well under 5 MB.
const MAX_BODY_BYTES = 10 * 1024 * 1024;

// 20 PDF exports per user per hour
const PDF_RATE_LIMIT = 20;
const PDF_RATE_WINDOW_MS = 60 * 60 * 1000;

import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import type { DocumentProps } from "@react-pdf/renderer";
import ReportPdfDocument from "@/lib/pdf/reportPdfDocument";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { inProcessRateLimit } from "@/lib/api/rateLimit";
import { readBodyWithLimit } from "@/lib/api/readBody";
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
  // Auth check — must be a signed-in user
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return Response.json({ error: "Service unavailable" }, { status: 503 });
  }
  let user = (await supabase.auth.getUser()).data.user;
  if (!user) {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (token) {
      const { data } = await supabase.auth.getUser(token);
      user = data.user;
    }
  }
  if (!user) {
    return Response.json({ error: "Unauthorised" }, { status: 401 });
  }

  if (!inProcessRateLimit(`pdf:${user.id}`, PDF_RATE_LIMIT, PDF_RATE_WINDOW_MS)) {
    return Response.json({ error: "Too many requests — please try again later." }, { status: 429 });
  }

  const bodyResult = await readBodyWithLimit(request, MAX_BODY_BYTES);
  if ("error" in bodyResult) {
    return Response.json({ error: bodyResult.error }, { status: bodyResult.status });
  }
  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(bodyResult.text);
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!isValidReportPayload(parsedBody)) {
    return Response.json({ error: "Invalid report data" }, { status: 400 });
  }

  const { report, photos = [] } = parsedBody;

  // SSRF guard — only allow base64 data URLs or Supabase Storage URLs
  const supabaseStorageBase = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "") + "/storage/v1/object";
  const invalidPhoto = photos.find((p: { dataUrl?: unknown }) => {
    if (typeof p.dataUrl !== "string") return true;
    const url = p.dataUrl as string;
    return !url.startsWith("data:image/") && !url.startsWith(supabaseStorageBase);
  });
  if (invalidPhoto) {
    return Response.json({ error: "Invalid photo data" }, { status: 400 });
  }

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
