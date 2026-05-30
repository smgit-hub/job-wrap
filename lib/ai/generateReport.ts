// ---------------------------------------------------------------------------
// AI Report Generator — server-side only
//
// Providers: openai | anthropic | gemini
// Controlled by AI_PROVIDER env var. Throws if no key is configured.
//
// Auto-detection order (when AI_PROVIDER is unset):
//   OPENAI_API_KEY → ANTHROPIC_API_KEY
//
// Gemini is NOT included in auto-detection — it does not reliably follow
// prompt constraints and may produce reports with invented values.
// It can still be forced explicitly with: AI_PROVIDER=gemini
// ---------------------------------------------------------------------------

import type { GeneratedReport } from "@/types/report";
import { buildPrompt, RECOMMENDATIONS_FALLBACK, type GenerateReportInput, type PromptParts } from "./prompt";
import { callAnthropic } from "./providers/anthropic";
import { callOpenAI } from "./providers/openai";
import { callGemini } from "./providers/gemini";

export type { GenerateReportInput };

// ── Provider runner ───────────────────────────────────────────────────────────

type ProviderFn = (parts: PromptParts) => Promise<GeneratedReport>;

function run(name: string, fn: ProviderFn, parts: PromptParts): Promise<GeneratedReport> {
  // Server-side only — safe to log provider name for debugging.
  // This never reaches the client.
  if (process.env.NODE_ENV !== "production") {
    console.log(`[generate-report] Using provider: ${name}`);
  }
  return fn(parts);
}

// ── Post-process: apply code-level fallbacks ──────────────────────────────────
// All recommendations now come from jobNotes (single recording flow).
// Trust the AI to extract them — apply fallback only when AI returns nothing.

function applyFallbacks(report: GeneratedReport): GeneratedReport {
  const recommendations = report.recommendations || RECOMMENDATIONS_FALLBACK;

  // If recommendations exist but the AI omitted the closing sentence from the summary,
  // append it deterministically.
  // Only match when "below" appears — specific enough to catch the closer without
  // false-matching unrelated sentences like "We noted the refrigerant pressure was low."
  const summaryHasCloser = /\bbelow\b/i.test(report.customerSummary);
  const customerSummary =
    recommendations && report.customerSummary && !summaryHasCloser
      ? `${report.customerSummary.trimEnd()} We've noted some items below to keep in mind.`
      : report.customerSummary;

  return { ...report, recommendations, customerSummary };
}

// ── Main export ───────────────────────────────────────────────────────────────
//
// IMPORTANT: AI output must always be reviewed and edited by the technician
// before a report is sent to a customer. The ReportEditor verification flow
// (section tick-boxes) is the designed enforcement point. Do not auto-send
// AI-generated reports without technician sign-off.

export async function generateReport(input: GenerateReportInput): Promise<GeneratedReport> {
  const provider = process.env.AI_PROVIDER;
  const parts = buildPrompt(input);

  let report: GeneratedReport;

  // Explicit provider selection
  if (provider === "anthropic") report = await run("Anthropic", callAnthropic, parts);
  else if (provider === "openai") report = await run("OpenAI", callOpenAI, parts);
  else if (provider === "gemini") report = await run("Gemini", callGemini, parts);
  // Auto-detect from whichever key is present (Gemini excluded — see header comment)
  // If both keys are set, try OpenAI first and fall back to Anthropic on failure.
  else if (process.env.OPENAI_API_KEY && process.env.ANTHROPIC_API_KEY) {
    try {
      report = await run("OpenAI", callOpenAI, parts);
    } catch (openAiErr) {
      console.warn("[generate-report] OpenAI failed, falling back to Anthropic:", openAiErr);
      report = await run("Anthropic", callAnthropic, parts);
    }
  } else if (process.env.OPENAI_API_KEY) report = await run("OpenAI", callOpenAI, parts);
  else if (process.env.ANTHROPIC_API_KEY) report = await run("Anthropic", callAnthropic, parts);
  else throw new Error("AI unavailable — please try again later.");

  return applyFallbacks(report);
}
