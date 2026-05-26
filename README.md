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
| `ANTHROPIC_API_KEY` | No | Anthropic API key — [console.anthropic.com](https://console.anthropic.com/) |
| `GOOGLE_GENERATIVE_AI_API_KEY` | No | Google Gemini key — [aistudio.google.com](https://aistudio.google.com/app/apikey) |
| `OPENAI_API_KEY` | No | OpenAI key — [platform.openai.com](https://platform.openai.com/api-keys) |
| `AI_PROVIDER` | No | Override provider: `anthropic`, `gemini`, `openai`, `mock`. Auto-detected from whichever key is set. |
| `AI_MODEL` | No | Override model. Defaults: Anthropic `claude-haiku-4-5-20251001`, Gemini `gemini-2.5-flash`, OpenAI `gpt-4o-mini` |
| `NEXT_PUBLIC_SUPABASE_URL` | No | Supabase project URL — enables auth and cloud sync |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | No | Supabase anon key |

Without any AI key the app silently falls back to mock generation. Without Supabase keys the app runs in localStorage-only mode with no auth.

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui |
| Icons | Lucide React |
| Persistence | localStorage (reports, customers, photos, business profile) |
| Voice | Web Speech API (browser-native) |
| AI | Anthropic Claude API |

---

## Project structure

```
app/
  page.tsx                           — Root screen router
  login/page.tsx                     — /login route
  signup/page.tsx                    — /signup route
  privacy/page.tsx                   — /privacy static page
  r/[token]/page.tsx                 — Public shareable report view
  api/generate-report/route.ts       — AI generation API route (server-side)
  api/export-pdf/route.ts            — Server-side PDF generation via @react-pdf/renderer
  api/share-report/route.ts          — Shared report link creation (requires Supabase)
  api/extract-equipment/route.ts     — Vision OCR for equipment nameplates

components/
  Dashboard.tsx          — Report list + new report CTA
  NewReportForm.tsx      — Step 1: Voice recording / Step 2: Confirm details
  ReportEditor.tsx       — Generated report editor
  ReportPreview.tsx      — On-screen preview + PDF/share actions
  BrandingSettings.tsx   — Business name, colours, contact info
  CustomerSelectScreen.tsx — Customer list, search, add/edit
  StepIndicator.tsx      — 4-step progress indicator
  PhotoSection.tsx       — Before/after photo capture and management

hooks/
  useSpeechRecognition.ts — Web Speech API hook

lib/
  ai/generateReport.ts    — AI provider logic + prompt engineering
  pdf/reportPdfDocument.tsx — React PDF document (server-side, @react-pdf/renderer)
  mockReportGenerator.ts  — Fallback mock generator (dev / no API key)
  storage.ts              — localStorage read/write helpers
  sampleData.ts           — Sample reports for first-load seeding

types/
  report.ts               — Full TypeScript data model
  speech.d.ts             — webkitSpeechRecognition type declarations
```

---

## User workflow

1. **Dashboard** — view recent reports, tap **Start New Job**
2. **Customer Select** — choose a returning customer or start fresh
3. **Job Notes** (Step 1) — tap mic to speak the job, or type; AI structures the report
4. **Confirm Details** (Step 2) — verify customer, address, service type, date
5. **Generate Report** — AI generates structured sections via `POST /api/generate-report`
6. **Report Editor** (Step 3) — review and edit each section; photos attached here
7. **Report Preview** (Step 4) — branded customer-facing view; PDF / Share / Email actions

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

The prompt lives in `lib/ai/prompt.ts` → `buildPrompt()`. Key constraints baked in:
- Never invent measurements, readings, or values not in the notes
- Plain professional English — no marketing tone, no jargon
- Short, readable bullet sections for field reports
- Works across service verticals (not HVAC-hardcoded)

To tune the output, edit `buildPrompt()` in `lib/ai/prompt.ts`.

### Swapping AI providers

Set `AI_PROVIDER` to `anthropic`, `openai`, or `gemini`. All three providers are implemented in `lib/ai/providers/` and share the same `buildPrompt()` / `parseResponse()` from `lib/ai/prompt.ts`. `NewReportForm.tsx` and `page.tsx` need zero changes.

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

1. User taps **Print / PDF** on the report preview screen
2. `ReportPreview` posts `{ report, photos }` to `POST /api/export-pdf`
3. The API route renders `lib/pdf/reportPdfDocument.tsx` server-side via `@react-pdf/renderer`
4. The response is a binary PDF stream; the browser saves it via a hidden `<a download>`

### PDF layout

`lib/pdf/reportPdfDocument.tsx` uses only React PDF primitives (`View`, `Text`, `Image`):
- Branded header bar (business brand colour, optional logo)
- Customer & job info grid
- Customer summary, Work Performed, Diagnostics, Recommendations (bullet lists)
- Before/after job photos (if attached)
- Footer with thank-you message and business contact details
- Fixed page-number bar on every page

### Export states

| State | Button shows |
|---|---|
| `idle` | Print / PDF |
| `generating` | Spinner + "Building…" |
| `done` | Checkmark + "Opened!" (resets after 3 s) |
| `error` | Error card below preview |

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
| Logo | localStorage (canvas-compressed PNG) | Upload to Storage |
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

proxy.ts                    — Conditional auth enforcement (passthrough if unconfigured)

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
| ✅ **4** | Branded PDF export (server-side `@react-pdf/renderer`) |
| ✅ **5** | Supabase Auth + Postgres + Storage (logo upload, cloud sync) |
| ✅ **6** | Customer management (persistent customer list, autofill on new jobs) |
| ✅ **7** | Before/after photo attachments (camera + gallery picker, shown in PDF) |
| ✅ **8** | Shareable report links (token-based public URL via Supabase) |
| ✅ **9** | Business branding (logo upload, brand colour, live preview) |

---

## Mock data

On first load, three sample HVAC reports are seeded into localStorage:

- **Tom Ashworth** — Annual Gas Heating Service, Preventative Maintenance (complete)
- **Priya Sharma** — Emergency Call, Failed Start Capacitor (complete)
- **James & Rachel Torres** — New Ductless Mini-Split Installation (complete)

Business profile defaults to **Apex Climate Services** (customisable in Settings).
