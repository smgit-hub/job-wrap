// ---------------------------------------------------------------------------
// Shared prompt builder and response parser
// Used identically by all AI providers.
// ---------------------------------------------------------------------------

import type { GeneratedReport, ServiceType, VoiceNotes } from "@/types/report";

export interface GenerateReportInput {
  serviceType: ServiceType;
  customServiceType?: string;
  customerName: string;
  technicianName: string;
  jobDate: string;
  voiceNotes: VoiceNotes;
}

const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  "hvac-maintenance": "HVAC Preventative Maintenance",
  "hvac-emergency": "HVAC Emergency Service",
  "hvac-repair": "HVAC Repair & Diagnostics",
  "hvac-install": "HVAC System Installation",
  "hvac-seasonal": "Pre-Season Service",
  "hvac-inspection": "HVAC System Inspection",
  "hvac-warranty": "HVAC Warranty Service",
  other: "Field Service",
};

function section(label: string, value: string): string {
  return value.trim() ? `${label}: ${value.trim()}` : `${label}: (not provided)`;
}

export function buildPrompt(input: GenerateReportInput): string {
  const serviceLabel =
    input.serviceType === "other" && input.customServiceType?.trim()
      ? input.customServiceType.trim()
      : (SERVICE_TYPE_LABELS[input.serviceType] ?? "Field Service");
  const technician = input.technicianName || "Technician";
  const { voiceNotes } = input;

  return `You are a senior field service technician writing up your own job report. Your task is to transform rough voice notes into a polished, professional service report — the quality a licensed tradesperson would produce for a customer record.

RULES:
- NEVER invent specific values: pressures, temperatures, voltages, amperages, part numbers, model numbers, or serial numbers not present in the notes.
- DO transform casual shorthand and spoken language into professional trade terminology. "It was bad" → "confirmed failed". "I cleaned it up" → "Cleaned and cleared [component]".
- DO infer reasonable outcomes from context. A completed repair implies the system was restored to operation. A maintenance visit implies the system was left in serviceable condition.
- DO apply standard industry knowledge for the service type — what a competent technician would note for this kind of job.
- DO distribute a single narrative across all three sections rather than repeating content.
- Write clearly: professional enough for a trade record, readable by a non-technical customer.

SECTION GUIDANCE:

customerSummary — A plain-English summary written FOR the customer, not the technician. 2–4 sentences. No jargon, no technical values, no bullet points — flowing prose only. Warm, reassuring tone. Structure: what was done → what was found → what's coming next. Write as if you're explaining to the homeowner at the front door before you leave. This is the first thing they read.

workCompleted — Everything done on site, past tense, bullet points (•). Expand brief mentions into full professional descriptions. For maintenance jobs, treat implied standard tasks (filter check, coil inspection, electrical check, etc.) as complete if the notes suggest the job went normally.

diagnostics — What was found, observed, tested, or confirmed. Bullet points (•). Include system condition, any faults found, and the status after work was completed. Close with a clear system status line: e.g. "System operating within normal parameters" or "Fault resolved — no further issues identified at time of service."

recommendations — What should happen next. Bullet points (•). Always include a next service interval appropriate to the service type. Flag anything that needs monitoring, a follow-up visit, or a customer decision. If the system is in good condition with no concerns, confirm that clearly rather than padding with generic advice.

JOB INFORMATION:
Service Type: ${serviceLabel}
Customer: ${input.customerName || "Customer"}
Technician: ${technician}
Date: ${input.jobDate}

TECHNICIAN'S NOTES:
${section("Equipment / system details", voiceNotes.equipmentDetails)}
${section("Work performed", voiceNotes.workCompleted)}
${section("Diagnostics & findings", voiceNotes.diagnostics)}
${section("Recommendations", voiceNotes.recommendations)}

Return ONLY a valid JSON object — no markdown fences, no explanation:
{
  "customerSummary": "string (2–4 sentences, plain English, no bullets)",
  "workCompleted": "string (• bullets separated by \\n)",
  "diagnostics": "string (• bullets separated by \\n)",
  "recommendations": "string (• bullets separated by \\n)"
}`;
}

const FALLBACK_REPORT: GeneratedReport = {
  customerSummary: "",
  workCompleted: "",
  diagnostics: "",
  recommendations: "",
};

export function parseResponse(text: string): GeneratedReport {
  let cleaned = text.trim();
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) cleaned = fenceMatch[1].trim();
  const objectMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!objectMatch) {
    console.error("[parseResponse] No JSON object found in AI response");
    return { ...FALLBACK_REPORT };
  }
  cleaned = objectMatch[0];

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(cleaned) as Record<string, unknown>;
  } catch (err) {
    console.error("[parseResponse] JSON.parse failed:", err);
    return { ...FALLBACK_REPORT };
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    console.error("[parseResponse] Unexpected JSON shape");
    return { ...FALLBACK_REPORT };
  }

  return {
    customerSummary: typeof parsed.customerSummary === "string" ? parsed.customerSummary : "",
    workCompleted: typeof parsed.workCompleted === "string" ? parsed.workCompleted : "",
    diagnostics: typeof parsed.diagnostics === "string" ? parsed.diagnostics : "",
    recommendations: typeof parsed.recommendations === "string" ? parsed.recommendations : "",
  };
}
