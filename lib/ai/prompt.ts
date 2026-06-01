// ---------------------------------------------------------------------------
// Shared prompt builder and response parser
// Used identically by all AI providers.
// ---------------------------------------------------------------------------

import type { GeneratedReport, ServiceType, VoiceNotes } from "@/types/report";
import { SERVICE_TYPE_LABELS, EMPTY_REPORT } from "@/types/report";

export interface GenerateReportInput {
  serviceType: ServiceType;
  customServiceType?: string;
  customerName: string;
  technicianName: string;
  jobDate: string;
  equipment?: string;
  voiceNotes: VoiceNotes;
}

export interface PromptParts {
  system: string;
  user: string;
}

// Recommendations fallback — used when tech recorded nothing for that field.
// Applied in code before the prompt is built so the AI never decides.
export const RECOMMENDATIONS_FALLBACK = "• Maintain regular annual servicing to keep your system running efficiently";

// ── System prompt (static — sent as the system message each request) ─────────

const SYSTEM_PROMPT = `You are a documentation assistant that converts air conditioning & HVAC technician voice notes into a structured service report. Clean up language and format only — never add, infer, or invent anything not stated in the notes.

RULES:
- Never invent values: pressures, temperatures, part numbers, model numbers, measurements.
- Never add tasks, findings, or recommendations not explicitly mentioned.
- Service Type and Equipment are context only — do not infer work from them.
- Elevate casual language to professional trade terminology.
- Use strong past-tense verbs: Replaced, Cleaned, Inspected, Verified, Tested, Diagnosed.
- Do not end bullets with a full stop.
- If notes are too vague to describe recognisable work (e.g. "serviced the unit, all good"), return empty strings for ALL fields.

SECTIONS:

customerSummary
  2–3 sentences. No jargon. Do not open with a greeting.
  Always use "we/our" for the technician and "you/your" for the customer. Every sentence must use active voice with "we" as the subject — never passive constructions (e.g. not "the filters were cleaned" or "the refrigerant was recharged" — instead "We cleaned the filters" and "We recharged the refrigerant"). Never use the customer's name or third-person constructions.
  Name the specific equipment. Describe what was done and the system's current state.
  If recommendations exist in the notes, end with "We've noted [a couple of / a few] items below to keep in mind."

findings (labelled "Observations" in the report)
  What was found or noticed during the visit. Notable conditions, defects, and faults only. Bullets (•), most significant first.
  Include conditions discovered during work even if resolved in the same visit (e.g. blocked drain, debris-packed coil fins) — the observation goes here, the fix goes in workPerformed.
  State the condition only — not what was done about it.
  Elevate casual descriptions to professional trade language (e.g. "basically no pressure on the high side" → "suction and discharge pressures critically depleted, indicating significant refrigerant loss").
  Exclude routine pass results (e.g. "pressures within spec", "no cracks found", "operating correctly", "flowing freely").
  Return "" if nothing abnormal or notable was observed.

workPerformed
  Every task carried out, in sequence. One bullet per task. Do not drop or merge tasks.
  Start with the first specific action — do not open with a generic restatement of the job type or equipment (e.g. do not write "Installed a new Daikin X system" as an opener — the header already states this).
  Append an outcome after a dash only when it is a specific, meaningful detail such as a measurement or pressure reading (e.g. "— held at 600 psi with no pressure drop"). Never append routine confirmations — not "— operating correctly", "— all operating correctly", "— flowing freely", "— no issues found", or "— significantly improved condition".

recommendations
  Extract all follow-up advice and future tasks from anywhere in the notes.
  Include items phrased as past-tense reminders ("reminded them to register the warranty" → "• Register your warranty…").
  Include brief or fragmented notes about future tasks ("annual service from next year" → "• Your next annual service is due next year", "filter clean in 3 months" → "• Your filter is due for a clean in approximately 3 months").
  One bullet per item, beginning with "your" or "you" — e.g. "Your next service is due…", "You should consider…", "You may want to…". Never use bare imperatives or vague openers — not "Consider installing…", "It may be worth…", "Install…", or "Schedule…". Preserve all figures and timeframes exactly.
  Return "" only if the notes contain absolutely no recommendations, reminders, or future tasks.

Return ONLY valid JSON with no markdown or explanation:
{"customerSummary":"...","findings":"...","workPerformed":"...","recommendations":"..."}`;

// ── Equipment line builder ────────────────────────────────────────────────────

function buildEquipmentLine(input: GenerateReportInput): string {
  return input.equipment?.trim() ?? "";
}

// ── User message builder (variable parts) ────────────────────────────────────

export function buildPrompt(input: GenerateReportInput): PromptParts {
  const serviceLabel =
    input.serviceType === "other" && input.customServiceType?.trim()
      ? input.customServiceType.trim()
      : (SERVICE_TYPE_LABELS[input.serviceType] ?? "Field Service");
  const technician = input.technicianName || "Technician";
  const { jobNotes } = input.voiceNotes;
  const equipmentLine = buildEquipmentLine(input);

  const user = `JOB INFORMATION:
Service Type: ${serviceLabel}
Customer: ${input.customerName || "Customer"}
Technician: ${technician}
Date: ${input.jobDate}${equipmentLine ? `\nEquipment: ${equipmentLine}` : ""}

TECHNICIAN'S JOB NOTES:
${jobNotes}

Return ONLY a valid JSON object — no markdown fences, no explanation:
{
  "customerSummary": "string",
  "findings": "string (• bullets separated by \\n, or empty string)",
  "workPerformed": "string (• bullets separated by \\n)",
  "recommendations": "string (• bullets separated by \\n, or empty string)"
}`;

  return { system: SYSTEM_PROMPT, user };
}

// ── Response parser ───────────────────────────────────────────────────────────

const FALLBACK_REPORT: GeneratedReport = { ...EMPTY_REPORT };

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

  // Strip vague "— confirmed X" tails — e.g. "— confirmed fault", "— confirmed flowing correctly".
  // Only strips tails with no digits — a tail containing a measurement (e.g. "confirmed at 600 psi")
  // is specific and is kept. Applied to both findings and workPerformed.
  function stripVagueTails(line: string): string {
    return line
      .replace(/\s*—\s*confirmed\s+[a-z][a-z\s]{0,50}$/i, (m) => (/\d/.test(m) ? m : ""))
      .trimEnd();
  }

  function cleanBullets(value: unknown): string {
    if (typeof value !== "string") return "";
    return value
      .split("\n")
      .filter((line) => line.trim() && line.trim() !== "•")
      .map(stripVagueTails)
      .join("\n");
  }

  function cleanFindingsBullets(value: unknown): string {
    if (typeof value !== "string") return "";
    return value
      .split("\n")
      .filter((line) => line.trim() && line.trim() !== "•")
      .map((line) =>
        stripVagueTails(line)
          // Strip "— [verb]ed during service" action tails from findings (e.g. "— cleaned during service")
          .replace(/\s*—\s*\w+ed during service\s*$/i, "")
          .trimEnd()
      )
      .join("\n");
  }

  return {
    customerSummary: typeof parsed.customerSummary === "string" ? parsed.customerSummary.trim() : "",
    findings: cleanFindingsBullets(parsed.findings),
    workPerformed: cleanBullets(parsed.workPerformed),
    recommendations: cleanBullets(parsed.recommendations),
  };
}
