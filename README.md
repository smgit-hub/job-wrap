# JobWrap

**Service reports in seconds — built for HVAC and trade technicians.**

→ **[jobwrap.app](https://jobwrap.app)**

---

## What it is

JobWrap is a mobile-first PWA that turns rough job notes into professional, customer-ready service reports. You do the job, open the app, speak a quick voice note about what you found and what you did — JobWrap structures it into a branded PDF report you can send to your customer on the spot.

No typing up notes at the end of the day. No chasing customers for signatures. Tap, talk, done.

---

## The problem it solves

Trade technicians spend 20–40 minutes per job writing up service reports. Most do it at the end of the day from memory, or skip it entirely. JobWrap removes that friction: voice input + AI generation means a complete, professional report in under 2 minutes, right from the job site.

---

## Tech stack

| | |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui |
| Auth & Database | Supabase (Postgres + RLS + Storage) |
| AI | Anthropic Claude (with OpenAI / Gemini fallbacks) |
| Voice | Web Speech API (browser-native) |
| PDF | @react-pdf/renderer (server-side) |
| Email | Resend |
| Payments | Stripe |
| Deployment | Vercel |

---

## Running locally

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

The app works without any API keys — AI generation falls back to a mock generator and auth is skipped when Supabase isn't configured.

See `.env.local.example` for all available environment variables.

---

## Key features

- **Voice-to-report** — speak job notes, AI generates structured service report sections
- **Branded PDFs** — reports include your logo, brand colour, and contact details
- **Customer management** — save customers for quick autofill on repeat jobs
- **Photo attachments** — before/after job photos embedded in the PDF
- **Shareable links** — token-based public URLs for customers to view reports online
- **Cloud sync** — reports and settings sync across devices via Supabase
- **Offline-capable** — localStorage fallback when offline; syncs on reconnect
- **PWA** — installable on iOS and Android from the browser

---

## License

Private — all rights reserved.
