import type { JobDetails, GeneratedReport, ServiceType, VoiceNotes } from "@/types/report";

// ---------------------------------------------------------------------------
// MOCK REPORT GENERATOR
// Used when no AI provider key is configured. Produces plausible HVAC reports
// from structured VoiceNotes by using keyword detection and templates.
// ---------------------------------------------------------------------------

const WORK_TEMPLATES: Record<string, string[]> = {
  filter: [
    "Replaced return-air filter. Previous filter was heavily loaded with debris — well past its service interval.",
    "Installed new MERV-8 air filter. Old filter was restricting airflow.",
    "Replaced 1-inch return-air filter. Heavily loaded with pet hair and cottonwood debris.",
  ],
  condenser: [
    "Cleaned outdoor condenser coils using coil cleaner and low-pressure rinse. Significant cottonwood and debris removed from fins.",
    "Flushed outdoor condenser coils. Removed grass clippings and organic debris.",
    "Cleaned condenser unit. Debris buildup was restricting airflow through the coil.",
  ],
  airflow: [
    "Verified supply airflow at all registers. Distribution balanced within acceptable range.",
    "Checked static pressure at air handler — reading within manufacturer specification.",
    "Inspected all supply and return registers. Airflow confirmed adequate throughout the home.",
  ],
  refrigerant: [
    "Verified refrigerant pressures using gauge manifold. System within normal operating range.",
    "Checked suction and discharge pressures. System holding full charge — no loss detected.",
  ],
  thermostat: [
    "Tested thermostat operation in heating and cooling modes. Both stages responding correctly.",
    "Installed new programmable thermostat. System commissioned and confirmed operating.",
    "Replaced faulty thermostat. New unit calibrated and programmed per customer schedule.",
  ],
  blower: [
    "Inspected and cleaned blower wheel. Light dust accumulation removed.",
    "Checked blower motor amp draw — reading within rated nameplate range.",
  ],
  drain: [
    "Flushed condensate drain line. Confirmed clear and free-flowing.",
    "Cleared condensate drain. Treated pan with algaecide tablet.",
  ],
  capacitor: [
    "Tested run capacitor — reading within acceptable tolerance range.",
    "Inspected capacitor. No bulging or signs of wear found.",
  ],
  leak: [
    "Inspected refrigerant circuit with electronic leak detector. Leak located and repaired.",
    "Traced refrigerant leak to service port valve. Core tightened and re-tested — no further leakage.",
  ],
  duct: [
    "Inspected accessible ductwork. No disconnections or major restrictions found.",
    "Checked duct connections at air handler. All joints secure and sealed.",
  ],
  igniter: [
    "Tested hot surface igniter — resistance within manufacturer specification.",
    "Inspected ignition system. Igniter confirmed functional.",
  ],
  burner: [
    "Cleaned burner assembly. Light oxidation residue removed from burner ports.",
    "Inspected and cleaned gas burners. Flame pattern confirmed even and consistent.",
  ],
  startup: [
    "Started system in cooling mode. Confirmed normal compressor start, correct airflow, and normal temperature split.",
    "Completed seasonal startup check. System powered on cleanly with no abnormal sounds.",
  ],
};

const OBSERVATION_POOL = [
  "System was operational on arrival. Cooling mode tested and confirmed functioning.",
  "System started cleanly with no abnormal sounds, vibration, or odours.",
  "Capacitor tested within acceptable tolerance. No bulging or signs of wear.",
  "Condenser coils were moderately fouled — consistent with spring cottonwood season.",
  "Electrical connections at disconnect and air handler inspected — tight and undamaged.",
  "Ductwork appears intact with no visible disconnections or major air leakage.",
  "Compressor amp draw within rated range at time of service.",
  "Evaporator coil visually clean. No visible ice or moisture buildup.",
];

const RECOMMENDATION_POOL: Record<ServiceType, string[]> = {
  "hvac-maintenance": [
    "Replace air filter every 6–8 weeks, or monthly if pets are in the home.",
    "Book autumn heating startup inspection before temperatures drop.",
    "Schedule next preventative maintenance in 6 months before peak cooling season.",
  ],
  "hvac-emergency": [
    "Schedule a follow-up inspection within 30 days to confirm the repair is holding.",
    "Book a full preventative maintenance visit before the next peak season.",
    "Consider a maintenance agreement to reduce the risk of future emergency calls.",
  ],
  "hvac-repair": [
    "A follow-up check in 30 days is recommended to confirm repair integrity.",
    "Schedule a full seasonal tune-up before the start of the next peak season.",
  ],
  "hvac-install": [
    "Register the new equipment with the manufacturer to activate the warranty.",
    "Schedule a first-year maintenance check 10–12 months after installation.",
  ],
  "hvac-seasonal": [
    "Replace air filter monthly during peak season for best efficiency.",
    "Book the next seasonal startup before the change of season.",
  ],
  "hvac-inspection": [
    "Schedule preventative maintenance before the start of heating or cooling season.",
    "Replace air filter every 1–3 months to maintain airflow and efficiency.",
  ],
  "hvac-warranty": [
    "Keep a copy of today's warranty service report for your records.",
    "Schedule a preventative maintenance visit outside of warranty coverage to stay ahead of issues.",
  ],
  other: [
    "Schedule a follow-up visit if any further issues arise.",
    "Contact us to book the next recommended service interval.",
  ],
};

const STATUS_CLOSE: Record<ServiceType, string> = {
  "hvac-maintenance": "System operating within normal parameters following seasonal maintenance service.",
  "hvac-emergency": "Fault resolved — system restored to normal operation.",
  "hvac-repair": "Fault resolved — system restored to normal operation.",
  "hvac-install": "System installed and commissioned — operating within normal parameters.",
  "hvac-seasonal": "System operating within normal parameters — ready for the season ahead.",
  "hvac-inspection": "Inspection complete — findings documented above.",
  "hvac-warranty": "Warranty service complete — system restored to normal operation.",
  other: "Service complete — system operating within normal parameters.",
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: T[], n: number): T[] {
  return [...arr].sort(() => 0.5 - Math.random()).slice(0, n);
}

function detectKeywords(text: string): string[] {
  const lower = text.toLowerCase();
  return Object.keys(WORK_TEMPLATES).filter((kw) => lower.includes(kw));
}

function buildWorkCompleted(voiceNotes: VoiceNotes): string {
  const source = voiceNotes.workCompleted || voiceNotes.diagnostics;
  const keywords = detectKeywords(source).slice(0, 5);
  const lines = keywords.map((kw) => `• ${pick(WORK_TEMPLATES[kw])}`);
  if (lines.length < 2) {
    lines.push(`• ${pick(WORK_TEMPLATES["filter"])}`);
    lines.push(`• ${pick(WORK_TEMPLATES["airflow"])}`);
  }
  return lines.join("\n");
}

function buildDiagnostics(voiceNotes: VoiceNotes, serviceType: ServiceType): string {
  const source = voiceNotes.diagnostics || voiceNotes.workCompleted;
  const lower = source.toLowerCase();
  const selected: string[] = [];
  selected.push(pick(OBSERVATION_POOL.slice(0, 2)));
  if (lower.includes("condenser") || lower.includes("coil")) selected.push(OBSERVATION_POOL[3]);
  if (lower.includes("capacitor") || lower.includes("electrical")) selected.push(OBSERVATION_POOL[2]);
  const bullets = pickN(selected, 3).map((o) => `• ${o}`);
  bullets.push(`• ${STATUS_CLOSE[serviceType] ?? STATUS_CLOSE["other"]}`);
  return bullets.join("\n");
}

function buildRecommendations(voiceNotes: VoiceNotes, serviceType: ServiceType): string {
  if (voiceNotes.recommendations.trim()) {
    return voiceNotes.recommendations
      .split(/\n|,/)
      .map((l) => l.trim())
      .filter(Boolean)
      .slice(0, 3)
      .map((l) => `• ${l.replace(/^[•\-]\s*/, "")}`)
      .join("\n");
  }
  const pool = RECOMMENDATION_POOL[serviceType] ?? RECOMMENDATION_POOL["hvac-maintenance"];
  return pickN(pool, 2).map((r) => `• ${r}`).join("\n");
}

const CUSTOMER_SUMMARY: Record<ServiceType, string> = {
  "hvac-maintenance":
    "Your system was serviced today and is in good working order. We inspected and cleaned all the key components and everything is running as it should. A couple of maintenance reminders are noted below to keep things running efficiently through the season.",
  "hvac-emergency":
    "We attended an emergency call today and have resolved the fault — your system is back up and running. The issue has been fully repaired and the system was confirmed operating correctly before we left. We've noted a follow-up recommendation below to make sure everything continues to perform as expected.",
  "hvac-repair":
    "We diagnosed and repaired the fault with your system today and it is back in normal operation. The issue has been fully resolved and everything was confirmed running correctly before we left. Please see the recommendations below for any suggested follow-up.",
  "hvac-install":
    "Your new system has been installed and is fully operational. We set everything up, tested it thoroughly, and confirmed it is running as expected. Please review the recommendations below — including registering your warranty — to get the most from your new equipment.",
  "hvac-seasonal":
    "Your system has been prepared for the season ahead and is ready to go. We ran through all the seasonal checks and confirmed everything is in good condition. A couple of tips to keep things running smoothly are noted below.",
  "hvac-inspection":
    "We completed a full inspection of your system today and our findings are detailed in this report. Everything has been assessed and documented. Please review the recommendations below — they outline anything worth keeping an eye on or addressing before the next season.",
  "hvac-warranty":
    "We attended today to carry out warranty service on your system and the work has been completed. Everything is confirmed operational and your warranty record has been updated. A copy of today's report is attached for your records.",
  other:
    "We attended your property today and completed the service as requested. Everything has been attended to and the system is confirmed operational. Please see the details below for a full breakdown of the work carried out.",
};

function buildCustomerSummary(serviceType: ServiceType): string {
  return CUSTOMER_SUMMARY[serviceType] ?? CUSTOMER_SUMMARY["other"];
}

export function generateMockReport(job: JobDetails): GeneratedReport {
  const { voiceNotes, serviceType } = job;
  return {
    customerSummary: buildCustomerSummary(serviceType),
    workCompleted: buildWorkCompleted(voiceNotes),
    diagnostics: buildDiagnostics(voiceNotes, serviceType),
    recommendations: buildRecommendations(voiceNotes, serviceType),
  };
}
