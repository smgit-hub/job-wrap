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

// Recommendations fallback — used when tech recorded nothing for that field.
// Applied in code before the prompt is built so the AI never decides.
export const RECOMMENDATIONS_FALLBACK = "• Schedule next routine service when due";

export function buildPrompt(input: GenerateReportInput): string {
  const serviceLabel =
    input.serviceType === "other" && input.customServiceType?.trim()
      ? input.customServiceType.trim()
      : (SERVICE_TYPE_LABELS[input.serviceType] ?? "Field Service");
  const technician = input.technicianName || "Technician";
  const { jobNotes } = input.voiceNotes;

  // recommendations is handled in code — only passed to the prompt if present
  const hasRecommendations = input.voiceNotes.recommendations.trim().length > 0;
  const recommendationsBlock = hasRecommendations
    ? `TECHNICIAN'S RECOMMENDATIONS:\n${input.voiceNotes.recommendations.trim()}`
    : "";

  return `You are a documentation assistant that formats technician field notes into a structured service report. Your only job is to clean up language and format — you do not add content, draw conclusions, or apply domain knowledge. Every statement in the output must trace directly to the technician's notes below.

RULES:
- NEVER invent specific values: pressures, temperatures, voltages, amperages, vacuum levels, part numbers, model numbers, or serial numbers not present in the notes.
- NEVER add tasks, checks, findings, or recommendations not explicitly stated in the notes.
- DO elevate the language of what was actually said — transform casual shorthand into professional trade terminology.
- DO infer reasonable outcomes where directly implied by the tech's own words: a completed repair implies the system was restored to operation.
- Use plain trade language. Keep each bullet under 120 characters where possible.
- Use strong past-tense verbs — "Replaced", "Cleaned", "Confirmed", "Inspected".
- Where the tech gave a result or detail, include it after a dash — e.g. "Cleaned burner assembly — oxidation residue removed" or "Inspected heat exchanger — no cracks detected".
- Do not end bullets with a full stop.

SECTION RULES:

customerSummary
  3 sentences, plain English, no jargon, no bullets, flowing prose, warm tone. Address the customer as "you/your" and use "we" for the technician.
  Sentence 1 — what was done: mention the key tasks carried out (e.g. "We serviced your ducted heating system today, cleaning the burner assembly, replacing the filter, and testing all zones.").
  Sentence 2 — honest outcome: state how the system is now. If findings include an issue or notable observation, acknowledge it — do not claim the system is fault-free when findings show otherwise.
  Sentence 3 — what's next: ONLY include this sentence if a TECHNICIAN'S RECOMMENDATIONS block appears below. If no such block is present, stop after sentence 2 — do not add any forward-looking or next-visit statement.
  Do NOT open with a greeting. Do NOT mention anything not in the notes.

findings
  What was found, observed, or diagnosed — extracted from the job notes.
  Bullet points (•), up to 5 bullets.
  State the observation only — do not include what was done about it. Actions belong in workPerformed.
  Only include observations the tech explicitly stated. Do not add standard checks or expected findings.
  If no findings are mentioned in the notes, output an empty string "".

workPerformed
  Tasks carried out on site — extracted from the job notes.
  One bullet per distinct task the tech mentioned. Do NOT merge or drop any stated task — if the tech listed 8 tasks, output 8 bullets.
  If the tech stated the result of a check without explicitly naming it as a task (e.g. "refrigerant charge sitting fine", "gas pressure spot on", "flue draw was good"), treat the check as a task and include it here (e.g. "Verified refrigerant charge — confirmed within specification", "Verified gas supply pressure — within specification"). The result also belongs in findings.
  Do NOT insert specific readings unless the tech stated them.

recommendations
  IMPORTANT: Only generate this field if TECHNICIAN'S RECOMMENDATIONS are provided below.
  If provided, format them as bullet points (•), one bullet per distinct recommendation.
  Preserve all specific timeframes, durations, and dates exactly as the tech stated them (e.g. "12–18 months", "2–3 years", "next May") — do not paraphrase or omit them.
  Write only what the tech stated. Do not add warranty registration, service intervals, or any advice not given.
  If no recommendations section appears below, output an empty string "".

JOB INFORMATION:
Service Type: ${serviceLabel}
Customer: ${input.customerName || "Customer"}
Technician: ${technician}
Date: ${input.jobDate}

TECHNICIAN'S JOB NOTES:
${jobNotes}
${recommendationsBlock ? `\n${recommendationsBlock}` : ""}

Return ONLY a valid JSON object — no markdown fences, no explanation:
{
  "customerSummary": "string",
  "findings": "string (• bullets separated by \\n, or empty string)",
  "workPerformed": "string (• bullets separated by \\n)",
  "recommendations": "string (• bullets separated by \\n, or empty string)"
}`;
}

const FALLBACK_REPORT: GeneratedReport = {
  customerSummary: "",
  findings: "",
  workPerformed: "",
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
    findings: cleanBullets(parsed.findings),
    workPerformed: cleanBullets(parsed.workPerformed),
    recommendations: cleanBullets(parsed.recommendations),
  };
}
