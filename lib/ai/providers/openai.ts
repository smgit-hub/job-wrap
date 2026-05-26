// ---------------------------------------------------------------------------
// OpenAI provider
// ---------------------------------------------------------------------------

import OpenAI from "openai";
import type { GeneratedReport } from "@/types/report";
import { parseResponse } from "../prompt";

// 30-second timeout — prevents infinite hangs on slow or unresponsive requests.
const TIMEOUT_MS = 30_000;

export async function callOpenAI(prompt: string): Promise<GeneratedReport> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");

  const client = new OpenAI({ apiKey });
  const model = process.env.AI_MODEL ?? "gpt-4o-mini";

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const completion = await client.chat.completions.create(
      {
        model,
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      },
      { signal: controller.signal }
    );

    const text = completion.choices[0]?.message?.content;
    if (!text) throw new Error("Empty response from OpenAI");
    return parseResponse(text);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("503") || msg.toLowerCase().includes("service unavailable")) {
      throw new Error("The AI service is temporarily busy — please try again in a moment.");
    }
    if (msg.includes("429") || msg.toLowerCase().includes("rate limit")) {
      throw new Error("AI request limit reached — please try again shortly.");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}
