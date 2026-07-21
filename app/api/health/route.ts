// ---------------------------------------------------------------------------
// Health check endpoint.
//
// Public, unauthenticated, read-only. Pinged periodically by a GitHub Action
// (see .github/workflows/keepalive.yml) purely to keep the Supabase project
// from being auto-paused after a period of inactivity on the free tier.
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, supabase: "not_configured" });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { error } = await supabase.from("business_settings").select("id", { count: "exact", head: true }).limit(1);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
