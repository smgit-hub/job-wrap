// ---------------------------------------------------------------------------
// Anthropic Claude provider
// ---------------------------------------------------------------------------

import Anthropic from "@anthropic-ai/sdk";
import type { GeneratedReport } from "@/types/report";
import { parseResponse } from "../prompt";

export async function callAnthropic(prompt: string): Promise<GeneratedReport> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const client = new Anthropic({ apiKey });
  const model = process.env.AI_MODEL ?? "claude-haiku-4-5-20251001";

  const message = await client.messages.create({
    model,
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const block = message.content[0];
  if (block.type !== "text") throw new Error("Unexpected response type from Anthropic");
  return parseResponse(block.text);
}
