// ---------------------------------------------------------------------------
// OpenAI provider
// ---------------------------------------------------------------------------

import OpenAI from "openai";
import type { GeneratedReport } from "@/types/report";
import { parseResponse } from "../prompt";

export async function callOpenAI(prompt: string): Promise<GeneratedReport> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");

  const client = new OpenAI({ apiKey });
  const model = process.env.AI_MODEL ?? "gpt-4o-mini";

  const completion = await client.chat.completions.create({
    model,
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const text = completion.choices[0]?.message?.content;
  if (!text) throw new Error("Empty response from OpenAI");
  return parseResponse(text);
}
