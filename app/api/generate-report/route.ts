// Next.js App Router API route — POST /api/generate-report
// Runs on the Node.js runtime (server-side only).
// API keys are never exposed to the client.
//
// TODO (future): add rate limiting (e.g. Upstash) before public deployment.
//
// Maximum accepted request body (32 KB) — well above any realistic job notes payload.
const MAX_BODY_BYTES = 32 * 1024;

export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { generateReport } from "@/lib/ai/generateReport";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { readBodyWithLimit } from "@/lib/api/readBody";
import type { ServiceType } from "@/types/report";

const VALID_SERVICE_TYPES = new Set<ServiceType>([
  "hvac-maintenance",
  "hvac-emergency",
  "hvac-repair",
  "hvac-install",
  "hvac-seasonal",
  "hvac-inspection",
  "hvac-duct-cleaning",
  "other",
]);

function isValidServiceType(value: unknown): value is ServiceType {
  return typeof value === "string" && VALID_SERVICE_TYPES.has(value as ServiceType);
}

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

export async function POST(request: Request) {
  // Auth check — must be a signed-in user.
  // Accepts either a session cookie (standard) or a Bearer token in the
  // Authorization header (fallback for iOS PWA where cookies may not persist).
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
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
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const bodyResult = await readBodyWithLimit(request, MAX_BODY_BYTES);
  if ("error" in bodyResult) {
    return NextResponse.json({ error: bodyResult.error }, { status: bodyResult.status });
  }
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(bodyResult.text) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Validate service type
  const serviceType = body.serviceType;
  if (!isValidServiceType(serviceType)) {
    return NextResponse.json({ error: "Invalid serviceType" }, { status: 400 });
  }

  // Validate voice notes — jobNotes is the only required field
  const voiceNotes = body.voiceNotes as Record<string, unknown> | undefined;
  const jobNotes = str(voiceNotes?.jobNotes);
  if (jobNotes.trim().length < 5) {
    return NextResponse.json(
      { error: "jobNotes must be at least 5 characters" },
      { status: 400 }
    );
  }

  // Truncate to prevent oversized prompts and reduce injection surface
  function truncate(s: string, max: number): string {
    return s.length > max ? s.slice(0, max) : s;
  }

  const input = {
    serviceType,
    customServiceType: truncate(str(body.customServiceType), 80) || undefined,
    customerName: truncate(str(body.customerName), 120),
    technicianName: truncate(str(body.technicianName), 120),
    jobDate: str(body.jobDate, new Date().toISOString().split("T")[0]),
    equipment: truncate(str(body.equipment), 200) || undefined,
    voiceNotes: {
      jobNotes: truncate(jobNotes.trim(), 3000),
    },
  };

  try {
    const report = await generateReport(input);
    return NextResponse.json({ report }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    console.error("[generate-report]", message);
    const clientMessage =
      process.env.NODE_ENV === "development"
        ? message
        : "Report generation failed. Please try again.";
    return NextResponse.json({ error: clientMessage }, { status: 500 });
  }
}
