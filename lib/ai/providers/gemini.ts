// ---------------------------------------------------------------------------
// Google Gemini provider
// ---------------------------------------------------------------------------

import { GoogleGenerativeAI } from "@google/generative-ai";
import type { GeneratedReport } from "@/types/report";
import { parseResponse } from "../prompt";

// 30-second timeout — prevents infinite hangs on slow or unresponsive requests.
const TIMEOUT_MS = 30_000;

export async function callGemini(prompt: string): Promise<GeneratedReport> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not set");

  const client = new GoogleGenerativeAI(apiKey);
  const modelName = process.env.AI_MODEL ?? "gemini-2.5-flash";

  const model = client.getGenerativeModel({ model: modelName });

  // Gemini's SDK does not natively accept an AbortSignal in generateContent,
  // so we race the call against a manual timeout promise.
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Gemini request timed out after 30 s")), TIMEOUT_MS)
  );

  const result = await Promise.race([
    model.generateContent(prompt),
    timeoutPromise,
  ]);

  const text = result.response.text();
  if (!text) throw new Error("Empty response from Gemini");
  return parseResponse(text);
}
