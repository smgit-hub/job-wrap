/**
 * Server-side AI rate limiter using Supabase.
 *
 * Limits:
 *  - Max 20 AI calls per user per UTC day
 *  - 30-second cooldown between calls
 *
 * Requires the `ai_usage` table (see SQL below).
 *
 * CREATE TABLE ai_usage (
 *   user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 *   usage_date  date        NOT NULL DEFAULT current_date,
 *   call_count  int         NOT NULL DEFAULT 0,
 *   last_call   timestamptz NOT NULL DEFAULT now(),
 *   PRIMARY KEY (user_id, usage_date)
 * );
 * ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;
 * -- Service role bypasses RLS so no policy needed for server-side writes.
 */

import { createClient } from "@supabase/supabase-js";

// ── Simple in-process rate limiter ────────────────────────────────────────────
// Used for PDF export and share-report. Keyed by user ID.
// Resets on cold start — good enough for Vercel serverless abuse prevention.

interface InProcessBucket {
  count: number;
  windowStart: number;
}

const buckets = new Map<string, InProcessBucket>();

export function inProcessRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now - bucket.windowStart > windowMs) {
    buckets.set(key, { count: 1, windowStart: now });
    return true;
  }

  if (bucket.count >= limit) return false;

  bucket.count++;
  return true;
}

const DAILY_LIMIT = 20;
const COOLDOWN_SECONDS = 30;

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; reason: "cooldown"; retryAfterSeconds: number }
  | { allowed: false; reason: "daily_limit" }
  | { allowed: false; reason: "unavailable" };

export async function checkAndIncrementAiUsage(userId: string): Promise<RateLimitResult> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const today = new Date().toISOString().split("T")[0];

  // Fetch existing row for today
  const { data, error } = await supabase
    .from("ai_usage")
    .select("call_count, last_call")
    .eq("user_id", userId)
    .eq("usage_date", today)
    .maybeSingle();

  if (error) {
    console.error("[rateLimit] fetch error:", error);
    // Fail open — don't block users due to DB issues
    return { allowed: true };
  }

  const now = new Date();

  if (data) {
    // Check cooldown
    const secondsSinceLast = (now.getTime() - new Date(data.last_call).getTime()) / 1000;
    if (secondsSinceLast < COOLDOWN_SECONDS) {
      return {
        allowed: false,
        reason: "cooldown",
        retryAfterSeconds: Math.ceil(COOLDOWN_SECONDS - secondsSinceLast),
      };
    }

    // Check daily limit
    if (data.call_count >= DAILY_LIMIT) {
      return { allowed: false, reason: "daily_limit" };
    }

    // Increment
    await supabase
      .from("ai_usage")
      .update({ call_count: data.call_count + 1, last_call: now.toISOString() })
      .eq("user_id", userId)
      .eq("usage_date", today);
  } else {
    // First call today — insert
    await supabase.from("ai_usage").insert({
      user_id: userId,
      usage_date: today,
      call_count: 1,
      last_call: now.toISOString(),
    });
  }

  return { allowed: true };
}
