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
import { buildPrompt, parseResponse, RECOMMENDATIONS_FALLBACK, type GenerateReportInput, type PromptParts } from "./prompt";
import { callAnthropic } from "./providers/anthropic";
import { callOpenAI } from "./providers/openai";
import { callGemini } from "./providers/gemini";

export type { GenerateReportInput };

// ── Per-provider wrappers ─────────────────────────────────────────────────────

async function runAnthropic(parts: PromptParts): Promise<GeneratedReport> {
  return callAnthropic(parts);
}

async function runOpenAI(parts: PromptParts): Promise<GeneratedReport> {
  return callOpenAI(parts);
}

async function runGemini(parts: PromptParts): Promise<GeneratedReport> {
  return callGemini(parts);
}

// ── Provider runner ───────────────────────────────────────────────────────────

type ProviderFn = (parts: PromptParts) => Promise<GeneratedReport>;

function run(name: string, fn: ProviderFn, parts: PromptParts): Promise<GeneratedReport> {
  console.log(`[generate-report] Using provider: ${name}`);
  return fn(parts);
}

// ── Post-process: apply code-level fallbacks ──────────────────────────────────
// Recommendations are only passed to the AI if the tech recorded them.
// If not, we apply the fallback here — the AI never decides.

function applyFallbacks(report: GeneratedReport, input: GenerateReportInput): GeneratedReport {
  const recommendations = input.voiceNotes.recommendations.trim()
    ? report.recommendations || RECOMMENDATIONS_FALLBACK
    : RECOMMENDATIONS_FALLBACK;

  // If recommendations exist but the AI omitted the closing sentence from the summary,
  // append it deterministically — the AI drops this despite prompt rules requiring it.
  const summaryHasCloser = /\bbelow\b|\bnoted\b|\bkeep an eye\b/i.test(report.customerSummary);
  const customerSummary =
    recommendations && report.customerSummary && !summaryHasCloser
      ? `${report.customerSummary.trimEnd()} We've noted some items below to keep an eye on.`
      : report.customerSummary;

  return { ...report, recommendations, customerSummary };
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function generateReport(input: GenerateReportInput): Promise<GeneratedReport> {
  const provider = process.env.AI_PROVIDER;
  const parts = buildPrompt(input);

  let report: GeneratedReport;

  // Explicit provider selection
  if (provider === "anthropic") report = await run("Anthropic", runAnthropic, parts);
  else if (provider === "openai") report = await run("OpenAI", runOpenAI, parts);
  else if (provider === "gemini") report = await run("Gemini", runGemini, parts);
  // Auto-detect from whichever key is present (Gemini excluded — see header comment)
  // If the primary provider fails, fall back to the secondary automatically.
  else if (process.env.OPENAI_API_KEY && process.env.ANTHROPIC_API_KEY) {
    try {
      report = await run("OpenAI", runOpenAI, parts);
    } catch (openAiErr) {
      console.warn("[generate-report] OpenAI failed, falling back to Anthropic:", openAiErr);
      report = await run("Anthropic", runAnthropic, parts);
    }
  } else if (process.env.OPENAI_API_KEY) report = await run("OpenAI", runOpenAI, parts);
  else if (process.env.ANTHROPIC_API_KEY) report = await run("Anthropic", runAnthropic, parts);
  else throw new Error("AI unavailable — please try again later.");

  return applyFallbacks(report, input);
}
