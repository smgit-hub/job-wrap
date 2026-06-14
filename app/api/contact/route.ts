import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const resend = new Resend(process.env.RESEND_API_KEY);

const CONTACT_EMAIL = process.env.CONTACT_EMAIL;
if (!CONTACT_EMAIL) throw new Error("CONTACT_EMAIL env var is required");
const CONTACT_EMAIL_SAFE: string = CONTACT_EMAIL;

// Simple in-process rate limit: max 3 submissions per IP per 10 minutes
const ipSubmissions = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 3;
const RATE_WINDOW_MS = 10 * 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = ipSubmissions.get(ip);
  if (!entry || now > entry.resetAt) {
    ipSubmissions.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  if (entry.count >= RATE_LIMIT) return true;
  entry.count++;
  return false;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  const body = await req.json();
  let { name, email, message } = body as { name?: string; email?: string; message?: string };

  if (!message?.trim()) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }

  // If name/email not provided, pull from auth session
  if (!name || !email) {
    const supabase = await getSupabaseServerClient();
    const user = supabase ? (await supabase.auth.getUser()).data.user : null;
    if (user) {
      email = email || user.email || "unknown";
      name = name || user.user_metadata?.full_name || email;
    }
  }

  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
  }

  const { error } = await resend.emails.send({
    from: "JobWrap Contact <hello@jobwrap.app>",
    to: CONTACT_EMAIL_SAFE,
    replyTo: email.trim(),
    subject: `New message from ${name.trim()}`,
    text: `Name: ${name.trim()}\nEmail: ${email.trim()}\n\n${message.trim()}`,
  });

  if (error) {
    console.error("Contact email error:", error);
    return NextResponse.json({ error: "Failed to send message." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
