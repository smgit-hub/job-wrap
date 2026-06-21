import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

function isAdminUser(user: { app_metadata?: Record<string, unknown> }) {
  const roles = user.app_metadata?.roles;
  return Array.isArray(roles) && roles.includes("admin");
}

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient<Database>(url, key, { auth: { persistSession: false } });
}

const resend = new Resend(process.env.RESEND_API_KEY);

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://jobwrap.app";

function welcomeHtml(name: string) {
  return `
<div style="font-family:sans-serif;max-width:560px;margin:0 auto">
  <div style="background:#f97316;padding:24px 32px;border-radius:12px 12px 0 0">
    <span style="color:#fff;font-size:20px;font-weight:800;letter-spacing:-0.5px">JobWrap</span>
  </div>
  <div style="background:#fff;padding:32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px">
    <h2 style="margin:0 0 16px;font-size:22px;color:#0f172a">Hey${name ? ` ${name}` : ""}, welcome to JobWrap 👋</h2>
    <p style="color:#475569;line-height:1.7;margin:0 0 16px">Thanks for signing up. JobWrap is built for tradies who want to spend less time on paperwork and more time on the tools.</p>
    <p style="color:#475569;line-height:1.7;margin:0 0 16px">Here's how it works: you do the job, open the app, tap <strong>+</strong>, and speak a quick voice note about what you found and what you did. JobWrap turns that into a professional service report — formatted, branded with your logo, and ready to send to your customer in seconds.</p>
    <p style="color:#475569;line-height:1.7;margin:0 0 24px">No typing up notes at the end of the day. No chasing customers for signatures. Just tap, talk, done.</p>
    <a href="${APP_URL}/app" style="display:inline-block;padding:12px 24px;background:#f97316;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px">Create your first report →</a>
    <p style="margin-top:32px;color:#94a3b8;font-size:14px;line-height:1.6">If you have any questions or run into anything, just reply to this email — I read every one.<br><br>Sean<br><span style="color:#cbd5e1">Founder, JobWrap</span></p>
  </div>
</div>`;
}

function gettingStartedHtml(name: string) {
  return `
<div style="font-family:sans-serif;max-width:560px;margin:0 auto">
  <div style="background:#f97316;padding:24px 32px;border-radius:12px 12px 0 0">
    <span style="color:#fff;font-size:20px;font-weight:800;letter-spacing:-0.5px">JobWrap</span>
  </div>
  <div style="background:#fff;padding:32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px">
    <h2 style="margin:0 0 12px;font-size:22px;color:#0f172a">3 steps to get the most out of JobWrap</h2>
    <p style="color:#475569;line-height:1.6">Hey${name ? ` ${name}` : ""}, here's how to hit the ground running:</p>
    <ol style="color:#475569;line-height:1.8;padding-left:20px">
      <li style="margin-bottom:12px"><strong>Set up your branding</strong> — Go to Settings and add your business name, logo, and brand colour. It takes two minutes and makes every report look professional.</li>
      <li style="margin-bottom:12px"><strong>Create your first report</strong> — Tap the <strong>+</strong> button, enter the job details, then use voice notes to describe what you found and what you did. JobWrap turns that into a structured service report automatically.</li>
      <li style="margin-bottom:12px"><strong>Send it to your customer</strong> — From the report preview, tap the share button to email a PDF, download it, or copy a shareable link — all in one tap.</li>
    </ol>
    <a href="${APP_URL}/app" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#f97316;color:#fff;border-radius:8px;text-decoration:none;font-weight:700">Open JobWrap →</a>
    <p style="margin-top:32px;color:#94a3b8;font-size:14px">If you get stuck, just reply to this email — I read every one.<br>Sean</p>
  </div>
</div>`;
}

function announcementHtml(name: string, message: string) {
  return `
<div style="font-family:sans-serif;max-width:560px;margin:0 auto">
  <div style="background:#f97316;padding:24px 32px;border-radius:12px 12px 0 0">
    <span style="color:#fff;font-size:20px;font-weight:800;letter-spacing:-0.5px">JobWrap</span>
  </div>
  <div style="background:#fff;padding:32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px">
    <h2 style="margin:0 0 12px;font-size:22px;color:#0f172a">What's new in JobWrap</h2>
    ${name ? `<p style="color:#475569">Hey ${name},</p>` : ""}
    <p style="color:#475569;line-height:1.6;white-space:pre-wrap">${message}</p>
    <a href="${APP_URL}/app" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#f97316;color:#fff;border-radius:8px;text-decoration:none;font-weight:700">Open JobWrap →</a>
    <p style="margin-top:32px;color:#94a3b8;font-size:14px">Sean — JobWrap</p>
  </div>
</div>`;
}

function broadcastHtml(subject: string, message: string) {
  return `
<div style="font-family:sans-serif;max-width:560px;margin:0 auto">
  <div style="background:#f97316;padding:24px 32px;border-radius:12px 12px 0 0">
    <span style="color:#fff;font-size:20px;font-weight:800;letter-spacing:-0.5px">JobWrap</span>
  </div>
  <div style="background:#fff;padding:32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px">
    <h2 style="margin:0 0 16px;font-size:22px;color:#0f172a">${subject}</h2>
    <p style="color:#475569;line-height:1.6;white-space:pre-wrap">${message}</p>
    <p style="margin-top:32px;color:#94a3b8;font-size:13px">This message was sent to you by the JobWrap team. <a href="${APP_URL}" style="color:#94a3b8">jobwrap.app</a></p>
    <p style="color:#cbd5e1;font-size:12px">© 2025 JobWrap — jobwrap.app</p>
  </div>
</div>`;
}

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdminUser(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const service = getServiceClient();
  if (!service) return NextResponse.json({ error: "Service role not configured" }, { status: 500 });

  const body = await req.json() as {
    type: "template" | "broadcast" | "individual";
    template?: "welcome" | "getting-started" | "announcement";
    subject?: string;
    message?: string;
    toUserId?: string;
    toAll?: boolean;
  };

  // Collect recipients
  let recipients: { email: string; name: string }[] = [];

  if (body.toAll) {
    const { data } = await service.auth.admin.listUsers({ perPage: 1000 });
    recipients = (data?.users ?? [])
      .filter((u) => u.email && !u.banned_until)
      .map((u) => ({
        email: u.email!,
        name: (u.user_metadata?.full_name as string | undefined) ?? u.email!.split("@")[0],
      }));
  } else if (body.toUserId) {
    const { data } = await service.auth.admin.getUserById(body.toUserId);
    if (data.user?.email) {
      recipients = [{
        email: data.user.email,
        name: (data.user.user_metadata?.full_name as string | undefined) ?? data.user.email.split("@")[0],
      }];
    }
  }

  if (recipients.length === 0) {
    return NextResponse.json({ error: "No recipients found" }, { status: 400 });
  }

  const errors: string[] = [];
  let sent = 0;

  for (const r of recipients) {
    let html = "";
    let subject = body.subject ?? "A message from JobWrap";

    if (body.type === "template") {
      if (body.template === "welcome") {
        html = welcomeHtml(r.name);
        subject = `Welcome to JobWrap, ${r.name}!`;
      } else if (body.template === "getting-started") {
        html = gettingStartedHtml(r.name);
        subject = "3 steps to get the most out of JobWrap";
      } else if (body.template === "announcement") {
        html = announcementHtml(r.name, body.message ?? "");
        subject = body.subject ?? "What's new in JobWrap";
      }
    } else {
      html = broadcastHtml(subject, body.message ?? "");
    }

    const { error } = await resend.emails.send({
      from: "Sean @ JobWrap <hello@jobwrap.app>",
      to: r.email,
      subject,
      html,
    });

    if (error) errors.push(`${r.email}: ${error.message}`);
    else sent++;
  }

  if (errors.length > 0 && sent === 0) {
    return NextResponse.json({ error: errors.join("; ") }, { status: 500 });
  }

  return NextResponse.json({ ok: true, sent, errors });
}
