import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { ServiceReport, JobPhoto } from "@/types/report";

// TODO(security): add rate limiting (e.g. Upstash) before public launch.
// Without rate limiting, any authenticated user can create unlimited share links
// which would fill the shared_reports table. Suggested limit: 20 shares/user/hour.

// TODO(security): shared_reports currently allows unauthenticated INSERT via the
// anon RLS policy (004_shared_reports.sql). Once auth is wired end-to-end, consider
// restricting INSERT to authenticated users only and storing user_id on the row
// so orphaned rows can be cleaned up later.

function generateToken(): string {
  // 12 hex chars = 48 bits of entropy — sufficient for non-secret share links
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Derive a safe URL from the incoming request.
// Reads the X-Forwarded-Host header first (set by Vercel/proxies) then falls
// back to the Host header. Only allows known schemes — never trusts a
// user-supplied protocol.
function buildShareUrl(request: NextRequest, token: string): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host") ?? "localhost:3000";
  // Never derive protocol from user-supplied headers
  const isLocal = host.includes("localhost") || host.includes("127.0.0.1");
  const protocol = isLocal ? "http" : "https";
  return `${protocol}://${host}/r/${token}`;
}

// Sanity-check the report payload so we don't persist garbage.
// This is not full schema validation — full Zod validation is a TODO.
function isValidReport(r: unknown): r is ServiceReport {
  if (typeof r !== "object" || r === null) return false;
  const report = r as Record<string, unknown>;
  return (
    typeof report.id === "string" &&
    typeof report.job === "object" && report.job !== null &&
    typeof report.report === "object" && report.report !== null
  );
}

// TODO(security): validate photo array more strictly — currently accepts any
// unknown[] from the client. Consider verifying that each photo.dataUrl is a
// valid base64 JPEG data URL and that the total payload size is reasonable.
// The API route itself has no body size limit — add one in next.config.ts
// (bodyParser.sizeLimit) or at the reverse-proxy layer.

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Sharing requires Supabase — check your environment variables." },
      { status: 503 }
    );
  }

  let report: ServiceReport;
  let photos: JobPhoto[];
  try {
    const body = (await request.json()) as {
      report: unknown;
      photos?: unknown[];
    };
    if (!isValidReport(body.report)) {
      return NextResponse.json({ error: "Invalid report data" }, { status: 400 });
    }
    report = body.report;
    photos = (body.photos ?? []) as JobPhoto[];
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const token = generateToken();

  const { error } = await supabase.from("shared_reports").insert({
    token,
    report_data: report as unknown as Record<string, unknown>,
    photos: photos as unknown[],
  });

  if (error) {
    console.error("[share-report] insert error:", error.message);
    return NextResponse.json({ error: "Failed to create share link" }, { status: 500 });
  }

  const url = buildShareUrl(request, token);
  return NextResponse.json({ url, token });
}
