// ---------------------------------------------------------------------------
// Google Gemini provider
// ---------------------------------------------------------------------------

import { GoogleGenerativeAI } from "@google/generative-ai";
import type { GeneratedReport } from "@/types/report";
import { parseResponse } from "../prompt";

export async function callGemini(prompt: string): Promise<GeneratedReport> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not set");

  const client = new GoogleGenerativeAI(apiKey);
  const modelName = process.env.AI_MODEL ?? "gemini-2.5-flash";

  const model = client.getGenerativeModel({ model: modelName });
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  if (!text) throw new Error("Empty response from Gemini");
  return parseResponse(text);
}
