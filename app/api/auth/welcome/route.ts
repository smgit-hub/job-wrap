import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://jobwrap.app";
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "Sean @ JobWrap <hello@jobwrap.app>";
const REPLY_TO = process.env.RESEND_REPLY_TO ?? "hello@jobwrap.app";

// Simple in-process rate limit — max 1 welcome email per address per 10 minutes
const sent = new Map<string, number>();
const WINDOW_MS = 10 * 60 * 1000;

export async function POST(req: NextRequest) {
  const { email } = await req.json() as { email?: string };

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const key = email.toLowerCase();
  const last = sent.get(key) ?? 0;
  if (Date.now() - last < WINDOW_MS) {
    return NextResponse.json({ ok: true }); // silently skip duplicate
  }
  sent.set(key, Date.now());

  const html = `
<div style="font-family:sans-serif;max-width:560px;margin:0 auto">
  <div style="background:#f97316;padding:24px 32px;border-radius:12px 12px 0 0">
    <span style="color:#fff;font-size:20px;font-weight:800;letter-spacing:-0.5px">JobWrap</span>
  </div>
  <div style="background:#fff;padding:32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px">
    <h2 style="margin:0 0 16px;font-size:22px;color:#0f172a">Welcome to JobWrap 👋</h2>
    <p style="color:#475569;line-height:1.7;margin:0 0 16px">Thanks for signing up. JobWrap is built for tradies who want to spend less time on paperwork and more time on the tools.</p>
    <p style="color:#475569;line-height:1.7;margin:0 0 16px">Here's how it works: you do the job, open the app, tap <strong>+</strong>, and speak a quick voice note about what you found and what you did. JobWrap turns that into a professional service report — formatted, branded with your logo, and ready to send to your customer in seconds.</p>
    <p style="color:#475569;line-height:1.7;margin:0 0 24px">No typing up notes at the end of the day. No chasing customers for signatures. Just tap, talk, done.</p>
    <a href="${APP_URL}/app" style="display:inline-block;padding:12px 24px;background:#f97316;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px">Create your first report →</a>
    <p style="margin-top:32px;color:#94a3b8;font-size:14px;line-height:1.6">If you have any questions or run into anything, just reply to this email — I read every one.<br><br>Sean<br><span style="color:#cbd5e1">Founder, JobWrap</span></p>
  </div>
</div>`;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    replyTo: REPLY_TO,
    subject: "Welcome to JobWrap!",
    html,
  });

  return NextResponse.json({ ok: true });
}
