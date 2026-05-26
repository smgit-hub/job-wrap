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
- NEVER add tasks, checks, or findings that were not mentioned or directly implied by the notes. If the tech said "replaced the filter and cleaned the coil", do not add "verified condensate drain", "tested thermostat", or "checked electrical connections" — those were not done as far as the record shows.
- DO elevate the language of what was actually said — transform casual shorthand into professional trade terminology. "cleaned the coil" → "Cleaned outdoor condenser coil of accumulated debris and environmental contaminants". Improve how things are described, not how many things are listed.
- DO infer reasonable outcomes from context. A completed repair implies the system was restored to operation. A maintenance visit implies the system was left in serviceable condition.
- DO distribute a single narrative across all three sections rather than repeating content.
- Write clearly: professional enough for a trade record, readable by a non-technical customer.
- Use plain trade language — "filter" not "filtration media", "condenser coil" not "heat exchange assembly", "system" not "HVAC apparatus". Write how a competent technician would actually write, not how a spec sheet reads. Keep each bullet under 90 characters where possible.

SECTION GUIDANCE:

customerSummary — A plain-English summary written FOR the customer, not the technician. 2–3 sentences maximum. No jargon, no technical values, no bullet points — flowing prose only. Warm, reassuring tone. Structure: what was done → outcome → what's next. Do NOT open with a greeting (e.g. "Good morning", "Good afternoon", "Dear [name]") — start directly with what was done.

workCompleted — Tasks carried out on site, past tense, bullet points (•). Maximum 5 bullets. Only include tasks explicitly mentioned or directly implied in the notes — do not pad with standard maintenance tasks not referenced. Elevate the language of each task without inventing new ones. Use strong, confident verbs — "Replaced", "Cleaned", "Confirmed", "Verified" — not weak ones like "Evaluated" or "Checked".

diagnostics — What was found, observed, or confirmed. Bullet points (•). Maximum 2 bullets. If no specific readings or faults were mentioned, write a single concise system status line — do not list individual components as "within spec" or "functioning as designed" when no specific checks were noted. One clear outcome line is better than three that all say the same thing. e.g. "System operating within normal parameters following service — no faults or deficiencies identified."

recommendations — What should happen next. Bullet points (•). Maximum 3 bullets, one line each. If the tech specified a timeframe (e.g. "before summer", "in 3 months"), use that — do not substitute a generic interval. Always include a next service recommendation. Only flag additional items if mentioned in the notes. Use strong, specific verbs — "Schedule", "Monitor", "Replace" — not vague language.

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

  function cleanBullets(value: unknown): string {
    if (typeof value !== "string") return "";
    return value
      .split("\n")
      .filter((line) => line.trim() && line.trim() !== "•")
      .join("\n");
  }

  return {
    customerSummary: typeof parsed.customerSummary === "string" ? parsed.customerSummary.trim() : "",
    workCompleted: cleanBullets(parsed.workCompleted),
    diagnostics: cleanBullets(parsed.diagnostics),
    recommendations: cleanBullets(parsed.recommendations),
  };
}
