import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { ServiceReport, JobPhoto } from "@/types/report";

function generateToken(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

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
      report: ServiceReport;
      photos?: JobPhoto[];
    };
    report = body.report;
    photos = body.photos ?? [];
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!report?.id || !report?.job || !report?.report) {
    return NextResponse.json({ error: "Invalid report data" }, { status: 400 });
  }

  const token = generateToken();

  const { error } = await supabase.from("shared_reports").insert({
    token,
    report_data: report as unknown as Record<string, unknown>,
    photos: photos as unknown[],
  });

  if (error) {
    console.error("[share-report] insert error:", error);
    return NextResponse.json({ error: "Failed to create share link" }, { status: 500 });
  }

  const host = request.headers.get("host") ?? "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const url = `${protocol}://${host}/r/${token}`;

  return NextResponse.json({ url, token });
}
