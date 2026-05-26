// Next.js App Router API route — POST /api/generate-report
// Runs on the Node.js runtime (server-side only).
// API keys are never exposed to the client.
//
// TODO (future): add rate limiting (e.g. Upstash) before public deployment.
// TODO (future): once Supabase Auth is wired to this route, validate session token.
//
// Prompt injection note: user strings (customerName, voiceNotes, etc.) are
// interpolated into the prompt in lib/ai/prompt.ts. The prompt structure uses
// labelled sections and a strict JSON output constraint which limits injection
// risk considerably. For additional hardening, consider truncating field lengths
// before passing to buildPrompt() — e.g. cap voiceNotes fields at 2000 chars.

export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { generateReport } from "@/lib/ai/generateReport";
import type { ServiceType } from "@/types/report";

const VALID_SERVICE_TYPES = new Set<ServiceType>([
  "hvac-maintenance",
  "hvac-emergency",
  "hvac-repair",
  "hvac-install",
  "hvac-seasonal",
  "hvac-inspection",
  "hvac-warranty",
  "other",
]);

function isValidServiceType(value: unknown): value is ServiceType {
  return typeof value === "string" && VALID_SERVICE_TYPES.has(value as ServiceType);
}

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Validate service type
  const serviceType = body.serviceType;
  if (!isValidServiceType(serviceType)) {
    return NextResponse.json({ error: "Invalid serviceType" }, { status: 400 });
  }

  // Validate structured voice notes — workCompleted is the only required section
  const voiceNotes = body.voiceNotes as Record<string, unknown> | undefined;
  const workCompleted = str(voiceNotes?.workCompleted);
  if (workCompleted.trim().length < 5) {
    return NextResponse.json(
      { error: "workCompleted must be at least 5 characters" },
      { status: 400 }
    );
  }

  // Truncate string fields to prevent excessively large prompts and reduce
  // prompt injection surface. Field lengths are generous for real-world use.
  function truncate(s: string, max: number): string {
    return s.length > max ? s.slice(0, max) : s;
  }

  const input = {
    serviceType,
    customServiceType: truncate(str(body.customServiceType), 80) || undefined,
    customerName: truncate(str(body.customerName), 120),
    technicianName: truncate(str(body.technicianName), 120),
    jobDate: str(body.jobDate, new Date().toISOString().split("T")[0]),
    voiceNotes: {
      equipmentDetails: truncate(str(voiceNotes?.equipmentDetails).trim(), 500),
      workCompleted: truncate(workCompleted.trim(), 2000),
      diagnostics: truncate(str(voiceNotes?.diagnostics).trim(), 2000),
      recommendations: truncate(str(voiceNotes?.recommendations).trim(), 1000),
    },
  };

  try {
    const { report, isMock } = await generateReport(input);
    return NextResponse.json(
      { report, isMock },
      {
        status: 200,
        headers: { "X-Generation-Mode": isMock ? "mock" : "ai" },
      }
    );
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
