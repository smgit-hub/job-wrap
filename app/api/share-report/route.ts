import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { readBodyWithLimit } from "@/lib/api/readBody";
import type { ServiceReport, JobPhoto } from "@/types/report";

// TODO(rate-limiting): add rate limiting (e.g. Upstash) before public launch.
// Suggested limit: 20 shares/user/hour.

// Share links expire after 90 days.
const SHARE_LINK_TTL_DAYS = 90;

function generateToken(): string {
  // 32 hex chars = 128 bits of entropy — unguessable, short enough for URLs
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function buildShareUrl(token: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://jobwrap.app";
  return `${appUrl}/r/${token}`;
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

// Maximum accepted request body (10 MB) — a report + 6 base64 photos is ~5 MB.
const MAX_BODY_BYTES = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Sharing requires Supabase — check your environment variables." },
      { status: 503 }
    );
  }

  // Auth check — must be a signed-in user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const bodyResult = await readBodyWithLimit(request, MAX_BODY_BYTES);
  if ("error" in bodyResult) {
    return NextResponse.json({ error: bodyResult.error }, { status: bodyResult.status });
  }

  let report: ServiceReport;
  let photos: JobPhoto[];
  try {
    const body = JSON.parse(bodyResult.text) as { report: unknown; photos?: unknown[] };
    if (!isValidReport(body.report)) {
      return NextResponse.json({ error: "Invalid report data" }, { status: 400 });
    }
    report = body.report;
    photos = (body.photos ?? []) as JobPhoto[];
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const token = generateToken();
  const expiresAt = new Date(Date.now() + SHARE_LINK_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase.from("shared_reports").insert({
    token,
    report_data: report as unknown as Record<string, unknown>,
    photos: photos as unknown[],
    user_id: user.id,
    expires_at: expiresAt,
  });

  if (error) {
    console.error("[share-report] insert error:", error.message);
    return NextResponse.json({ error: "Failed to create share link" }, { status: 500 });
  }

  const url = buildShareUrl(token);
  return NextResponse.json({ url, token });
}
