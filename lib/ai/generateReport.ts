// ---------------------------------------------------------------------------
// AI Report Generator — server-side only
//
// Providers: anthropic (default) | openai | gemini
// Controlled by AI_PROVIDER env var. Falls back to mock if no key is set.
//
// Auto-detection order (when AI_PROVIDER is unset):
//   ANTHROPIC_API_KEY → GOOGLE_GENERATIVE_AI_API_KEY → OPENAI_API_KEY → mock
//
// Quota / rate-limit errors from any provider fall back to mock silently.
// Force mock at any time with: AI_PROVIDER=mock
// ---------------------------------------------------------------------------

import type { GeneratedReport } from "@/types/report";
import { buildPrompt, type GenerateReportInput } from "./prompt";
import { callAnthropic } from "./providers/anthropic";
import { callOpenAI } from "./providers/openai";
import { callGemini } from "./providers/gemini";

export type { GenerateReportInput };

// ── Quota / rate-limit detection ─────────────────────────────────────────────

function isQuotaError(err: unknown): boolean {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    return (
      msg.includes("429") ||
      msg.includes("quota") ||
      msg.includes("rate limit") ||
      msg.includes("billing") ||
      msg.includes("exceeded") ||
      msg.includes("resource_exhausted")   // Gemini gRPC code
    );
  }
  return false;
}

// ── Mock fallback ─────────────────────────────────────────────────────────────

async function getMockReport(input: GenerateReportInput): Promise<GeneratedReport> {
  const { generateMockReport } = await import("@/lib/mockReportGenerator");
  return generateMockReport({
    customerName: input.customerName,
    serviceAddress: "",
    serviceType: input.serviceType,
    customServiceType: input.customServiceType,
    jobDate: input.jobDate,
    voiceNotes: input.voiceNotes,
  });
}

// ── Per-provider wrappers (build prompt here, pass string to provider) ────────

async function runAnthropic(input: GenerateReportInput): Promise<GeneratedReport> {
  return callAnthropic(buildPrompt(input));
}

async function runOpenAI(input: GenerateReportInput): Promise<GeneratedReport> {
  return callOpenAI(buildPrompt(input));
}

async function runGemini(input: GenerateReportInput): Promise<GeneratedReport> {
  return callGemini(buildPrompt(input));
}

// ── Provider runner with quota fallback ───────────────────────────────────────

type ProviderFn = (input: GenerateReportInput) => Promise<GeneratedReport>;

async function withFallback(
  name: string,
  fn: ProviderFn,
  input: GenerateReportInput
): Promise<{ report: GeneratedReport; isMock: boolean }> {
  try {
    return { report: await fn(input), isMock: false };
  } catch (err) {
    if (isQuotaError(err)) {
      console.warn(`[generate-report] ${name} quota exceeded — using mock fallback`);
      return { report: await getMockReport(input), isMock: true };
    }
    throw err;
  }
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function generateReport(
  input: GenerateReportInput
): Promise<{ report: GeneratedReport; isMock: boolean }> {
  const provider = process.env.AI_PROVIDER;

  // Explicit mock override
  if (provider === "mock") {
    return { report: await getMockReport(input), isMock: true };
  }

  // Explicit provider selection
  if (provider === "anthropic") return withFallback("Anthropic", runAnthropic, input);
  if (provider === "openai")    return withFallback("OpenAI",    runOpenAI,    input);
  if (provider === "gemini")    return withFallback("Gemini",    runGemini,    input);

  // Auto-detect from whichever key is present
  if (process.env.ANTHROPIC_API_KEY)           return withFallback("Anthropic", runAnthropic, input);
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) return withFallback("Gemini",    runGemini,    input);
  if (process.env.OPENAI_API_KEY)              return withFallback("OpenAI",    runOpenAI,    input);

  // No key configured — mock
  return { report: await getMockReport(input), isMock: true };
}
