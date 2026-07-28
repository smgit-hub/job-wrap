export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const TRIAL_DAYS = 14;

export async function POST() {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Unavailable" }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId) return NextResponse.json({ error: "Price not configured" }, { status: 500 });

  // Subscribing is only allowed once the in-app free trial has actually
  // ended — no early checkout, no Stripe trial_period_days. This avoids
  // the two trial clocks (in-app + Stripe) ever disagreeing.
  const { data: profile } = await supabase
    .from("profiles")
    .select("created_at")
    .eq("id", user.id)
    .maybeSingle();

  const createdAt = (profile as { created_at: string } | null)?.created_at;
  const daysSinceSignup = createdAt ? (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24) : 0;
  if (daysSinceSignup < TRIAL_DAYS) {
    return NextResponse.json({ error: "Your free trial hasn't ended yet." }, { status: 403 });
  }

  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: user.email,
    client_reference_id: user.id,
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/app?subscribed=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/app?settings=1`,
    metadata: { user_id: user.id },
  });

  return NextResponse.json({ url: session.url });
}
