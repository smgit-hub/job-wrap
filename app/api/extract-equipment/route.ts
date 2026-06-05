// Next.js App Router API route — POST /api/extract-equipment
// Accepts a multipart form with an "image" field.
// Runs vision OCR to extract equipment nameplate details.
// Falls back to empty string if no provider is available — caller handles gracefully.

export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const PROMPT = `You are reading a photograph of an HVAC equipment nameplate or data plate.
Extract all visible information: brand/manufacturer, model number, serial number, capacity/tonnage, refrigerant type, voltage, and any other relevant specs.
Return ONLY a single concise plain-text line suitable for a field service report — no labels, no JSON, e.g.:
"Carrier 2-ton central AC, model 24ACC636A003, serial F4A1234567, R-410A, 208-230V/1ph"
If the image is not a nameplate, is unreadable, or you are not confident, return an empty string.`;

type SupportedMime = "image/jpeg" | "image/png" | "image/gif" | "image/webp";
const VALID_MIMES: SupportedMime[] = ["image/jpeg", "image/png", "image/gif", "image/webp"];
function normaliseMime(raw: string): SupportedMime {
  return VALID_MIMES.includes(raw as SupportedMime) ? (raw as SupportedMime) : "image/jpeg";
}

// ── Provider calls ────────────────────────────────────────────────────────────

async function withAnthropic(base64: string, mime: SupportedMime): Promise<string> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 256,
    messages: [{
      role: "user",
      content: [
        { type: "image", source: { type: "base64", media_type: mime, data: base64 } },
        { type: "text", text: PROMPT },
      ],
    }],
  });
  const block = msg.content[0];
  return block.type === "text" ? block.text.trim() : "";
}

async function withGemini(base64: string, mime: string): Promise<string> {
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const client = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);
  const model = client.getGenerativeModel({ model: "gemini-2.5-flash" });
  const result = await model.generateContent([
    { inlineData: { data: base64, mimeType: mime } },
    PROMPT,
  ]);
  return result.response.text().trim();
}

async function withOpenAI(base64: string, mime: string): Promise<string> {
  const OpenAI = (await import("openai")).default;
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 256,
    messages: [{
      role: "user",
      content: [
        { type: "image_url", image_url: { url: `data:${mime};base64,${base64}` } },
        { type: "text", text: PROMPT },
      ],
    }],
  });
  return completion.choices[0]?.message?.content?.trim() ?? "";
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  // Auth check — must be a signed-in user
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
  let user = (await supabase.auth.getUser()).data.user;
  if (!user) {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (token) {
      const { data } = await supabase.auth.getUser(token);
      user = data.user;
    }
  }
  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("image") as File | null;
  if (!file) return NextResponse.json({ error: "No image provided" }, { status: 400 });

  const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image must be under 5 MB" }, { status: 413 });
  }

  // Reject non-image MIME types before reading the buffer.
  // HEIC/HEIF are common on iOS but not supported by current providers — they
  // are excluded here so callers get a clear error rather than a silent empty string.
  // TODO(future): add HEIC → JPEG server-side conversion to support iOS photos.
  if (!VALID_MIMES.includes(file.type as SupportedMime)) {
    return NextResponse.json({ error: "Unsupported image type. Use JPEG, PNG, GIF, or WebP." }, { status: 415 });
  }

  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
  const mime = normaliseMime(file.type);
  const provider = process.env.AI_PROVIDER;

  try {
    let text = "";
    if (provider === "anthropic" || (!provider && process.env.ANTHROPIC_API_KEY)) {
      text = await withAnthropic(base64, mime);
    } else if (provider === "gemini" || (!provider && process.env.GOOGLE_GENERATIVE_AI_API_KEY)) {
      text = await withGemini(base64, mime);
    } else if (provider === "openai" || (!provider && process.env.OPENAI_API_KEY)) {
      text = await withOpenAI(base64, mime);
    }
    return NextResponse.json({ text });
  } catch (err) {
    console.error("[extract-equipment]", err);
    // Never fail hard — let the user type manually
    return NextResponse.json({ text: "" });
  }
}
