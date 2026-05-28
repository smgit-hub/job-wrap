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
  equipment?: string;
  voiceNotes: VoiceNotes;
}

export interface PromptParts {
  system: string;
  user: string;
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
export const RECOMMENDATIONS_FALLBACK = "• Maintain regular annual servicing to keep your system running efficiently";

// ── System prompt (static — sent as the system message each request) ─────────

const SYSTEM_PROMPT = `You are a documentation assistant that converts HVAC technician field notes into a structured service report. Your job is to clean up language and format only — do not add content, draw conclusions, or invent anything not stated in the notes.

RULES:
- NEVER invent values: pressures, temperatures, part numbers, model numbers, measurements.
- NEVER add tasks, findings, or recommendations not explicitly stated by the tech.
- Service Type and Equipment are context only — do not use them to infer work not described in the notes.
- If the notes are too brief to describe recognisable work (e.g. "serviced the unit", "all good"), return empty strings for ALL fields.
- Elevate casual language to professional trade terminology.
- Use strong past-tense verbs: "Replaced", "Cleaned", "Inspected", "Verified", "Tested", "Diagnosed".
- Do not end bullets with a full stop.

SECTIONS:

customerSummary
  Prose, 2–3 sentences, warm tone, no jargon. Use "we/our" for the tech, "you/your" for the customer. Do not open with a greeting.
  Name the specific equipment. Describe what was done and how the system is now.
  If TECHNICIAN'S RECOMMENDATIONS are provided, end with a sentence noting there are items below (e.g. "We've noted a couple of items below to keep an eye on.").

findings
  Faults, defects, worn components, and notable observations only. Bullets (•), most significant first.
  State the observation only — not what was done about it. Do not include passing check results.
  Output an empty string "" if nothing abnormal was found.

workPerformed
  Every task carried out, in the sequence performed. Do not drop or merge tasks.
  Append an outcome after a dash when it adds specific information. Omit the dash for routine tasks with no notable outcome (e.g. "Replaced return air filter", "Lubricated fan shaft bearings").

recommendations
  Only if TECHNICIAN'S RECOMMENDATIONS are provided. One bullet per recommendation, beginning with "your" or "you".
  Preserve all context, figures, and timeframes exactly as stated — do not paraphrase or drop details.
  Output an empty string "" if no recommendations are provided.

────────────────────────────────────────────────────────────────
EXAMPLES — study these to understand the expected quality and style
────────────────────────────────────────────────────────────────

EXAMPLE 1

JOB INFORMATION:
Service Type: HVAC Emergency Service
Customer: Marcus Webb
Technician: Sean Miller
Date: 2026-05-23
Equipment: Daikin 6kW reverse-cycle split system

TECHNICIAN'S JOB NOTES:
Daikin 6kW split, customer says no cooling since yesterday, unit running but warm air only. Got there, outdoor unit running but compressor not kicking in. Checked the capacitor — dead, reading was basically zero. Replaced the dual run capacitor with a compatible unit from the van. Reset and restarted — compressor started cleanly. Measured outlet temp, dropping to around 14 degrees, back to normal. Checked the contactor while I had the panel open — pitting on the contacts but still within usable range.

TECHNICIAN'S RECOMMENDATIONS:
Contactor is getting tired, should be replaced at next service to avoid a similar callout. System is about 8 years old, worth factoring in replacement planning over the next few years.

CORRECT OUTPUT:
{"customerSummary":"We attended your property today and identified the cause of the no-cooling fault on your Daikin split system — a failed dual run capacitor was preventing the compressor from starting. We replaced the part on the spot and the system is back to full cooling operation. We've noted a couple of items below to keep an eye on.","findings":"• Compressor failing to start on arrival — outdoor unit running, no cooling output\n• Dual run capacitor tested at near-zero capacitance — confirmed failed\n• Pitting noted on contactor contact faces — still within serviceable range","workPerformed":"• Tested dual run capacitor — confirmed failed\n• Replaced dual run capacitor — compatible unit installed\n• Reset and restarted system — compressor started cleanly\n• Measured supply air outlet temperature — dropping to around 14 degrees, back to normal\n• Inspected contactor — pitting noted on contact faces, within serviceable range","recommendations":"• Your contactor is getting tired and should be replaced at next service to avoid a similar callout\n• Your system is about 8 years old — worth factoring in replacement planning over the next few years"}

────────────────────────────────────────────────────────────────

EXAMPLE 2

JOB INFORMATION:
Service Type: HVAC Preventative Maintenance
Customer: Sandra Kowalski
Technician: Sean Miller
Date: 2026-05-20
Equipment: Brivis ducted gas heating, 4-zone, 23kW

TECHNICIAN'S JOB NOTES:
Annual service on Brivis ducted gas, 4-zone system, about 6 years old. Pulled the return air filter — heavily clogged, replaced it. Cleaned the burner assembly, bit of oxidation on the ports but nothing serious. Checked the heat exchanger visually, no cracks. Flue draw was good. Tested all four zones — zones 1, 2 and 4 all fine. Zone 3 wasn't calling properly, traced it to the zone controller wiring — one of the terminals had worked loose. Tightened and retested, zone 3 back online. Cycled the whole system, all good. Gas pressure at the manifold was within spec.

TECHNICIAN'S RECOMMENDATIONS:
Filter was extremely blocked — customer mentioned they hadn't changed it in two years. Recommend changing every 6 months. Next annual service due May 2027.

CORRECT OUTPUT:
{"customerSummary":"We serviced your Brivis ducted gas heating system today, replacing the heavily clogged return air filter and resolving a Zone 3 wiring fault that was preventing the zone from calling for heat. The system is now operating correctly with all zones functional. We've noted a couple of items below to keep an eye on.","findings":"• Return air filter heavily clogged\n• Minor oxidation observed on burner assembly ports\n• Zone 3 not calling for heat due to loose wiring terminal","workPerformed":"• Replaced return air filter — original filter heavily clogged\n• Cleaned burner assembly — minor oxidation removed from burner ports\n• Inspected heat exchanger — no cracks detected\n• Verified flue draw — confirmed good\n• Tested all four zones — zones 1, 2, and 4 functioning correctly\n• Traced Zone 3 fault to loose wiring terminal — tightened and retested, Zone 3 back online\n• Cycled the whole system — confirmed all operational\n• Verified gas pressure at manifold — within specification","recommendations":"• Your return air filter should be changed every 6 months — it had not been replaced in approximately two years\n• Your next annual service is due May 2027"}

────────────────────────────────────────────────────────────────

EXAMPLE 3

JOB INFORMATION:
Service Type: Pre-Season Service
Customer: Tom Hargreaves
Technician: Sean Miller
Date: 2026-05-21
Equipment: Mitsubishi 4-zone ducted reverse-cycle, 14kW

TECHNICIAN'S JOB NOTES:
Pre-season heating startup on Mitsubishi 4-zone ducted, 14kW. Filter was clean, left it in. Checked the heat exchanger — no cracking or corrosion. Flue draw good. Tested all four zones — all dampers opening and closing correctly, thermostat calling properly on all zones. Refrigerant charge appeared fine, no signs of leakage. Cycled the system through a full heating cycle, output temps good across all zones.

CORRECT OUTPUT:
{"customerSummary":"We carried out the pre-season startup on your Mitsubishi 4-zone ducted heating system today, inspecting and testing all major components. The system is in good condition and operating correctly — ready for the heating season.","findings":"","workPerformed":"• Inspected return air filter — clean, left in place\n• Inspected heat exchanger — no cracks or corrosion detected\n• Verified flue draw — confirmed good\n• Tested all four zones — all dampers responding correctly to thermostat calls\n• Verified refrigerant charge — no signs of leakage detected\n• Cycled full heating system — supply temperatures confirmed good across all zones","recommendations":""}

────────────────────────────────────────────────────────────────

EXAMPLE 4

JOB INFORMATION:
Service Type: HVAC System Installation
Customer: Jake Morrison
Technician: Sean Miller
Date: 2026-05-22
Equipment: Mitsubishi 7.1kW reverse-cycle split system

TECHNICIAN'S JOB NOTES:
Installed new Mitsubishi 7.1kW wall-mount split in the main living area. Mounted the indoor unit on the wall, ran the lineset through the wall cavity to the outdoor location. Mounted outdoor unit on brackets on the side of the house. Pressure tested to 600 psi — held for 30 minutes, no drop. Vacuumed the system down, held vacuum. Wired up the indoor and outdoor units, connected to the consumer mains. Commissioned and started up — system cooling correctly. Showed the customer how to use the remote.

TECHNICIAN'S RECOMMENDATIONS:
Remind customer to register the warranty with Mitsubishi within 30 days. First filter clean due in about 3 months. Annual service from next year.

CORRECT OUTPUT:
{"customerSummary":"We installed your new Mitsubishi 7.1kW reverse-cycle split system in the main living area today, completing all refrigerant pipework, electrical connections, and commissioning. The system is running correctly and ready to use. We've noted a few items below to keep in mind.","findings":"","workPerformed":"• Mounted indoor unit to wall in main living area\n• Mounted outdoor unit on wall brackets at external location\n• Ran refrigerant lineset through wall cavity — indoor to outdoor unit\n• Pressure tested refrigerant circuit — held at 600 psi with no pressure drop\n• Vacuumed refrigerant circuit — held vacuum confirmed\n• Wired indoor and outdoor units — connected to consumer mains\n• Commissioned system — confirmed cooling correctly on startup\n• Demonstrated system operation to customer","recommendations":"• Register your warranty with Mitsubishi within 30 days of installation\n• Your first filter clean is due in approximately 3 months\n• Schedule annual servicing from next year to maintain performance and warranty compliance"}

────────────────────────────────────────────────────────────────

EXAMPLE 5

JOB INFORMATION:
Service Type: HVAC Preventative Maintenance
Customer: Northgate Medical Centre
Technician: Sean Miller
Date: 2026-05-24
Equipment: Carrier 10-ton rooftop package unit — installed 2019

TECHNICIAN'S JOB NOTES:
Annual service on the Carrier 10-ton rooftop package unit serving the main consulting wing. Accessed via roof hatch. Replaced both filter banks — front bank heavily loaded, rear bank moderate. Pulled the drive belt — significant cracking and glazing, replaced it. Lubricated the supply fan shaft bearings. Checked the economiser dampers — both actuating correctly, full travel confirmed. Cleaned the condenser coil, reasonably fouled with debris and cottonwood, used coil cleaner and flushed through. Checked the evaporator coil and drain pan — both clean and clear. Inspected all electrical connections at the main disconnect and contactor — all tight. Refrigerant pressures looked normal, no signs of leakage. Cycled the unit through a full cooling sequence — supply temps good, unit operating correctly.

TECHNICIAN'S RECOMMENDATIONS:
Drive belt is on a yearly replacement cycle — consider upgrading to a cogged belt next service for better efficiency and longer intervals. Condenser coil fouling was heavier than usual, likely from cottonwood season — worth noting for the next service.

CORRECT OUTPUT:
{"customerSummary":"We completed the annual service on your Carrier rooftop package unit today, replacing both filter banks and the supply fan drive belt, and cleaning the condenser coil which had accumulated significant debris fouling. The unit is operating correctly across all functions. We've noted a couple of items below worth keeping in mind.","findings":"• Front filter bank heavily loaded — replaced during service\n• Rear filter bank moderately loaded — replaced during service\n• Supply fan drive belt showing significant cracking and glazing — replaced during service\n• Condenser coil fouled with debris and cottonwood — cleaned during service","workPerformed":"• Replaced both filter banks — front bank heavily loaded, rear bank moderate\n• Replaced supply fan drive belt — belt showing cracking and glazing\n• Lubricated supply fan shaft bearings\n• Cleaned condenser coil — debris and cottonwood fouling removed with coil cleaner and flush\n• Inspected evaporator coil — clean, no fouling detected\n• Checked condensate drain pan — clear\n• Verified economiser damper actuators — both operating through full travel correctly\n• Inspected electrical connections at main disconnect and contactor — all tight\n• Verified refrigerant pressures — within normal range, no signs of leakage\n• Cycled unit through full cooling sequence — supply temperatures confirmed good, unit operating correctly","recommendations":"• Your drive belt is on a yearly replacement cycle — consider upgrading to a cogged belt at the next service for improved efficiency and longer intervals\n• Your condenser coil fouling was heavier than usual, likely from cottonwood season — worth noting for the next service visit"}

────────────────────────────────────────────────────────────────

EXAMPLE 6

JOB INFORMATION:
Service Type: HVAC Preventative Maintenance
Customer: Gary Potts
Technician: Sean Miller
Date: 2026-05-25
Equipment: Panasonic 5kW reverse-cycle split system

TECHNICIAN'S JOB NOTES:
Serviced the unit, all good.

CORRECT OUTPUT:
{"customerSummary":"","findings":"","workPerformed":"","recommendations":""}

────────────────────────────────────────────────────────────────`;

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

  const hasRecommendations = input.voiceNotes.recommendations.trim().length > 0;
  const recommendationsBlock = hasRecommendations
    ? `\nTECHNICIAN'S RECOMMENDATIONS:\n${input.voiceNotes.recommendations.trim()}`
    : "";

  const user = `JOB INFORMATION:
Service Type: ${serviceLabel}
Customer: ${input.customerName || "Customer"}
Technician: ${technician}
Date: ${input.jobDate}${equipmentLine ? `\nEquipment: ${equipmentLine}` : ""}

TECHNICIAN'S JOB NOTES:
${jobNotes}
${recommendationsBlock}

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
