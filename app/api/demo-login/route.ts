// POST /api/demo-login
// Signs in as the demo account server-side so the password never reaches the client.
// Returns the session tokens for the client to set.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const DEMO_EMAIL = "demo@jobwrap.app";

export async function POST() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const password = process.env.DEMO_PASSWORD;

  if (!url || !anonKey) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
  if (!password) {
    return NextResponse.json({ error: "Demo unavailable" }, { status: 503 });
  }

  const client = createClient(url, anonKey);
  const { data, error } = await client.auth.signInWithPassword({
    email: DEMO_EMAIL,
    password,
  });

  if (error || !data.session) {
    return NextResponse.json({ error: "Demo unavailable" }, { status: 503 });
  }

  return NextResponse.json({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  });
}
