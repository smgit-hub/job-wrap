import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
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
    to: process.env.CONTACT_EMAIL!,
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
