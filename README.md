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

## Security

### Environment variables

- **Never commit `.env.local`** — it is gitignored via `.env*`. Use `.env.local.example` as the reference template.
- `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, and `GOOGLE_GENERATIVE_AI_API_KEY` are **server-only** — they have no `NEXT_PUBLIC_` prefix and are never sent to the browser.
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are intentionally public — they are the project URL and the Supabase *anon* key (scoped to Row Level Security policies).
- **Never set `BYPASS_AUTH=true` in production** — the middleware will throw a runtime error if you do.

### Supabase RLS

Row Level Security is enabled on all tables (`profiles`, `business_settings`, `reports`). Users can only read and write their own rows via `auth.uid() = user_id`. The `shared_reports` table is intentionally public-read (the token is the credential).

See `supabase/migrations/` for the full policy definitions.

### Deployment checklist

Before deploying to production:

- [ ] Rotate any API keys that were ever in `.env.local` during development
- [ ] Confirm `BYPASS_AUTH` is **not** set in the production environment
- [ ] Run `supabase/migrations/` in order against your production Supabase project
- [ ] Verify RLS policies are enabled in Supabase Dashboard → Table Editor → RLS
- [ ] Add rate limiting to `/api/generate-report`, `/api/export-pdf`, and `/api/share-report` (e.g. [Upstash Rate Limit](https://upstash.com/docs/redis/sdks/ratelimit-ts/overview))
- [ ] Add a `Content-Security-Policy` header in `next.config.ts` (there is a TODO comment there)
- [ ] Remove or gate sample data seeding (`lib/storage.ts → seedSampleData`) for real production installs

### Dependency audit notes

- `npm audit` reports 2 moderate vulnerabilities in `postcss < 8.5.10` via `next@16.2.6`. This is a transitive build-time dependency bundled inside Next.js itself; `npm audit fix --force` would downgrade Next.js to v9 (a breaking change). This is a known issue tracked in the Next.js repository — watch for a patched Next.js release and upgrade when available. The vulnerability (XSS via `</style>` in CSS stringify output) affects build output, not runtime request handling.

### Known limitations / TODOs

- **No rate limiting** on API routes — must be added before public launch (TODO comments in each route)
- **Shared report links never expire** — no `expires_at` column yet; tokens are permanent until the row is deleted
- **`/api/export-pdf` and `/api/generate-report` have no auth check** — any caller can generate a PDF or call the AI; session validation is a TODO
- **Photos stored as base64 in localStorage** — suitable for prototype; should migrate to IndexedDB or Supabase Storage for production
- **No Content-Security-Policy** — a TODO comment exists in `next.config.ts`

---

## Mock data

On first load, three sample HVAC reports are seeded into localStorage:

- **Tom Ashworth** — Annual Gas Heating Service, Preventative Maintenance (complete)
- **Priya Sharma** — Emergency Call, Failed Start Capacitor (complete)
- **James & Rachel Torres** — New Ductless Mini-Split Installation (complete)

Business profile defaults to **Apex Climate Services** (customisable in Settings).

---

## Launch Checklist

### Pre-launch
- [ ] `npm run build` passes clean
- [ ] `npx tsc --noEmit` passes clean
- [ ] `npm run lint` passes clean
- [ ] `.env.local` populated with real keys (never committed)
- [ ] Supabase RLS verified on all tables
- [ ] Auth flows tested (login, signup, logout, session recovery)
- [ ] AI report generation tested end-to-end
- [ ] PDF export tested on mobile
- [ ] Email/Share tested on iOS and Android
- [ ] PWA install tested (Add to Home Screen)
- [ ] Mobile QA on iPhone Safari and Android Chrome
- [ ] PWA icons created: `public/icons/icon-192.png`, `public/icons/icon-512.png`, `public/apple-touch-icon.png`

### Known Limitations
- Photos stored as base64 in localStorage (5 MB browser quota — migrate to Supabase Storage for production)
- No rate limiting on API routes (add Upstash before public launch)
- Share links do not expire (add `expires_at` column to `shared_reports` table)
- `/api/export-pdf` has no auth check (add session validation before public launch)
- Speech recognition requires Chrome or Safari (Firefox not supported)
- PDF export requires server-side rendering — offline use not supported

### Future Improvements
- Migrate photo storage from localStorage to Supabase Storage
- Add rate limiting to all API routes (Upstash recommended)
- Add share link expiry and revocation
- Add push notifications for upcoming service reminders
- Add customer email field to report sharing flow
- Multi-technician / team support

### Deployment Notes
- Set all environment variables in your hosting provider (Vercel)
- Ensure `ANTHROPIC_API_KEY` and `OPENAI_API_KEY` are server-only (no `NEXT_PUBLIC_` prefix)
- Supabase anon key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) is safe to expose — it is public by design
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client
- Run database migrations in order before first deploy
- Test Supabase RLS policies after each schema change
