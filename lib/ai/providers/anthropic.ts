// ---------------------------------------------------------------------------
// Anthropic Claude provider
// ---------------------------------------------------------------------------

import Anthropic from "@anthropic-ai/sdk";
import type { GeneratedReport } from "@/types/report";
import { parseResponse } from "../prompt";

// 30-second timeout — generous for Claude Haiku; prevents infinite hangs on
// the Edge when the AI provider is slow or unresponsive.
const TIMEOUT_MS = 30_000;

export async function callAnthropic(prompt: string): Promise<GeneratedReport> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const client = new Anthropic({ apiKey });
  const model = process.env.AI_MODEL ?? "claude-haiku-4-5-20251001";

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const message = await client.messages.create(
      {
        model,
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      },
      { signal: controller.signal }
    );

    const block = message.content[0];
    if (block.type !== "text") throw new Error("Unexpected response type from Anthropic");
    return parseResponse(block.text);
  } finally {
    clearTimeout(timeoutId);
  }
}
