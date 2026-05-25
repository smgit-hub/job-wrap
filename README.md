# JobWrap — Service Reports in Seconds

A mobile-first web app that helps HVAC technicians turn rough job notes into polished, customer-ready service reports in under 2 minutes.

---

## Quick start

```bash
npm install
cp .env.local.example .env.local   # then add your API key
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). For voice input, use Chrome or Edge (mobile or desktop).

> **Without an API key** the app still works — it falls back to the mock generator automatically.

---

## Environment variables

Copy `.env.local.example` to `.env.local`:

```bash
cp .env.local.example .env.local
```

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes (for AI) | Your Anthropic API key from [console.anthropic.com](https://console.anthropic.com/) |
| `AI_MODEL` | No | Model to use. Default: `claude-haiku-4-5-20251001`. Options: `claude-haiku-4-5-20251001`, `claude-sonnet-4-6`, `claude-opus-4-7` |
| `AI_PROVIDER` | No | Default: `anthropic`. Future: `openai` |

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui |
| Icons | Lucide React |
| Persistence | localStorage (draft only) |
| Voice | Web Speech API (browser-native) |
| AI | Anthropic Claude API |

---

## Project structure

```
app/
  page.tsx                       — Root screen router
  api/generate-report/route.ts   — AI generation API route (server-side)

components/
  Dashboard.tsx          — Report list + new report CTA
  NewReportForm.tsx      — Step 1: Job details / Step 2: Voice + notes
  ReportEditor.tsx       — Generated report editor
  ReportPreview.tsx      — On-screen preview + PDF export trigger
  PrintableReport.tsx    — Inline-styled A4 template (rasterized for PDF)
  BrandingSettings.tsx   — Business name, colours, contact info
  StepIndicator.tsx      — 4-step progress indicator

hooks/
  useSpeechRecognition.ts — Web Speech API hook

lib/
  ai/generateReport.ts    — AI provider logic + prompt engineering
  pdf/exportReportPdf.ts  — html2canvas + jsPDF export utility
  mockReportGenerator.ts  — Fallback mock generator (dev / no API key)
  storage.ts              — localStorage read/write helpers
  sampleData.ts           — Sample reports for first-load seeding

types/
  report.ts               — Full TypeScript data model
  speech.d.ts             — webkitSpeechRecognition type declarations
```

---

## User workflow

1. **Dashboard** — view recent reports, tap **New Service Report**
2. **Job Details** (Step 1) — customer, address, service type, date, equipment
3. **Job Notes** (Step 2) — tap **Record Job Notes**, speak the job, tap **Stop Recording**; or type
4. **Generate Report** — AI generates structured sections via `POST /api/generate-report`
5. **Report Editor** (Step 3) — review and edit each section; save at any time
6. **Report Preview** (Step 4) — branded customer-facing view; PDF/Share buttons stubbed

Settings (gear icon on dashboard) allow business name, contact, and brand colour changes.

---

## Stage 3: AI generation

### How it works

1. User taps **Generate Report**
2. `NewReportForm` calls `onGenerate(job)` — async, throws on failure
3. `page.tsx` posts job details to `POST /api/generate-report`
4. The API route calls `lib/ai/generateReport.ts`
5. If `ANTHROPIC_API_KEY` is set: calls Claude, returns structured JSON
6. If no key: falls back to mock generator silently
7. Response populates the editable `ReportEditor`

### Generation error handling

| Scenario | What happens |
|---|---|
| API key missing | Silent mock fallback — app works normally |
| AI provider error | Error card shown in the notes form; user can retry |
| Malformed AI response | Parsed defensively — missing fields default to empty strings |
| Double-tap | Ignored — button disabled while generating |

### Prompt engineering

The prompt lives in `lib/ai/generateReport.ts` → `buildPrompt()`. Key constraints baked in:
- Never invent measurements, readings, or values not in the notes
- Plain professional English — no marketing tone, no jargon
- Short, readable bullet sections for field reports
- Works across service verticals (not HVAC-hardcoded)

To tune the output, edit `buildPrompt()`. The swap comments inside that file point to where few-shot examples, multi-language support, and template IDs should go.

### Swapping AI providers

Set `AI_PROVIDER=openai` and add an `OPENAI_API_KEY`. Then implement `callOpenAI()` in `lib/ai/generateReport.ts` — the `buildPrompt()` and `parseResponse()` helpers are shared. `NewReportForm.tsx` and `page.tsx` need zero changes.

---

## Stage 2: Voice input

The `useSpeechRecognition` hook wraps the browser Web Speech API:

- **Continuous mode** — keeps listening through natural pauses; auto-restarts on silence timeout
- **Interim results** — live word preview shown below the textarea
- **Final commit** — finalized words appended to notes on stop
- **Session model** — each tap of "Record" starts fresh; prior notes preserved

### Browser support

| Browser | Support |
|---|---|
| Chrome (Android, desktop) | Full |
| Edge (desktop) | Full |
| Samsung Internet | Full (webkit prefix) |
| Safari (iOS 14.5+) | Partial — no continuous mode |
| Firefox | Not supported |

**Chrome on Android is recommended for field use.** Unsupported browsers fall back gracefully to typed notes only.

---

## Stage 4: PDF export

### How it works

1. User taps **Save PDF** on the report preview screen
2. `html2canvas` rasterizes the off-screen `PrintableReport` component at 2× pixel density
3. `jsPDF` embeds the canvas as a JPEG and handles multi-page A4 layout
4. Browser downloads the file as `customer-name_service-report_YYYY-MM-DD.pdf`

`jspdf` and `html2canvas` are dynamically imported — they only load when the user taps the button, keeping the initial page bundle small.

### PrintableReport design

`components/PrintableReport.tsx` uses **100% inline styles** (no Tailwind). This is intentional — `html2canvas` does not reliably capture Tailwind utility classes, which are purged and may be absent from the captured CSS context. Inline styles are always captured correctly.

The PDF layout:
- Branded header bar (business brand colour + business initials)
- Customer & job info grid
- Work Completed, Observations, Recommendations (bullet lists)
- Customer Notes, Follow-Up callout, Technician Summary
- Footer with thank-you message and business contact details
- Report generation timestamp

### Multi-page support

Reports that exceed one A4 page are automatically split across pages using jsPDF's repeated-image-with-offset technique.

### Export states

| State | Button shows |
|---|---|
| `idle` | Save PDF |
| `generating` | Spinner + "Generating PDF…" |
| `done` | Checkmark + "PDF Saved" (resets after 3 s) |
| `error` | Error card below preview |

### Future PDF improvements

See `lib/pdf/exportReportPdf.ts` for TODO comments:
- Server-side Puppeteer rendering for vector text output
- Multiple branded templates (compact, formal, photo-first)
- Photo attachment pages (before/after images)
- Customer signature block
- Email sending directly from the app
- Shared customer link (read-only URL)

---

## Stage 5: Supabase scaffold

### What's included

- **Auth** — Email/password sign-up and sign-in via `@supabase/ssr`; session persisted across reloads
- **Database** — Postgres tables for `profiles`, `business_settings`, and `reports` (full schema in `supabase/migrations/`)
- **Row Level Security** — Every table locked to `auth.uid()` — users see only their own data
- **Storage** — `logos` bucket for business logo images; upload/remove from Business Settings (requires sign-in)
- **Graceful degradation** — App works identically without credentials; all Supabase calls gate on `isSupabaseConfigured()`

### Activating Supabase

1. Create a free project at [supabase.com](https://supabase.com/)
2. Copy your URL and anon key from **Project Settings → API**
3. Add to `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
4. Run migrations in Supabase Dashboard → **SQL Editor**, in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
   - `supabase/migrations/003_storage_buckets.sql`
5. Restart the dev server — auth routes (`/login`, `/signup`) and cloud sync are now active

### What changes with Supabase enabled

| Feature | Without Supabase | With Supabase |
|---|---|---|
| Reports | localStorage only | DB (cloud) |
| Business settings | localStorage | DB (cloud) |
| Logo | Not available | Upload to Storage |
| Auth | None | Email/password, with `/login` `/signup` |
| Middleware | Passthrough | Redirects unauthenticated users to `/login` |

### Files added in Stage 5

```
supabase/migrations/
  001_initial_schema.sql    — Tables, triggers, indexes
  002_rls_policies.sql      — Per-user RLS on all tables
  003_storage_buckets.sql   — logos bucket + storage RLS

lib/supabase/
  client.ts                 — Browser client singleton + isSupabaseConfigured()
  server.ts                 — SSR server client (cookie-aware)
  auth.ts                   — signIn / signUp / signOut / getUser helpers
  queries/
    reports.ts              — CRUD for reports table
    businessSettings.ts     — CRUD for business_settings table
    profiles.ts             — Profile read + upsert
    storage.ts              — Logo upload / delete / publicUrl

components/auth/
  AuthProvider.tsx          — React context, useAuth() hook
  LoginForm.tsx             — Mobile-first login form
  SignupForm.tsx            — Mobile-first sign-up form

app/
  login/page.tsx            — /login route
  signup/page.tsx           — /signup route

middleware.ts               — Conditional auth enforcement (passthrough if unconfigured)

types/
  database.ts               — TypeScript types mirroring the DB schema
```

---

## Stage roadmap

| Stage | Feature |
|---|---|
| ✅ **1** | Frontend scaffold, mock generation, localStorage |
| ✅ **2** | Browser speech-to-text (Web Speech API) |
| ✅ **3** | Real AI generation via `POST /api/generate-report` (Claude / OpenAI) |
| ✅ **4** | Branded PDF export (`html2canvas` + `jsPDF`, client-side) |
| ✅ **5** | Supabase Auth + Postgres + Storage (logo upload, cloud sync) |

---

## Mock data

On first load, three sample HVAC reports are seeded into localStorage:

- **Sandra Kowalski** — Preventative Maintenance (complete)
- **David Nguyen** — Repair Service (complete)
- **Rita Patel** — System Inspection (draft)

Business profile defaults to **Arctic Air HVAC Services** (customisable in Settings).
