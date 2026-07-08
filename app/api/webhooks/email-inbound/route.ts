import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "JobWrap <hello@jobwrap.app>";
const FORWARD_TO = process.env.RESEND_FORWARD_TO ?? "";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      data?: {
        from?: string;
        subject?: string;
        html_body?: string;
        text_body?: string;
      };
    };

    const email = body.data ?? {};
    const from = email.from ?? "Unknown sender";
    const subject = email.subject ?? "(no subject)";
    const htmlBody = email.html_body ?? "";
    const textBody = email.text_body ?? "";

    if (!FORWARD_TO) {
      console.error("[email-inbound] RESEND_FORWARD_TO is not set");
      return NextResponse.json({ ok: false }, { status: 200 });
    }

    const forwardedHtml = htmlBody
      ? `<p style="font-family:sans-serif;color:#64748b;font-size:13px;border-bottom:1px solid #e2e8f0;padding-bottom:12px;margin-bottom:20px">
           <strong>From:</strong> ${from}<br>
           <strong>Subject:</strong> ${subject}
         </p>${htmlBody}`
      : "";

    const forwardedText = `From: ${from}\nSubject: ${subject}\n\n${textBody}`;

    // Reply-to the original sender so replying to the forwarded email reaches them, not a dead address
    const senderEmail = from.match(/<(.+)>/)?.[1] ?? from;

    await resend.emails.send({
      from: FROM_EMAIL,
      to: FORWARD_TO,
      replyTo: senderEmail,
      subject: `Fwd: ${subject}`,
      ...(forwardedHtml ? { html: forwardedHtml } : {}),
      text: forwardedText,
    });
  } catch (err) {
    console.error("[email-inbound] Error:", err);
  }

  // Always return 200 so Resend doesn't retry
  return NextResponse.json({ ok: true }, { status: 200 });
}
