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

  // Trial days remaining is computed from the user's actual signup date —
  // not from which button/flow triggered checkout — so it can't be gamed
  // and there's no way to "double dip" by waiting out the in-app trial
  // and then getting a second free trial from Stripe.
  const { data: profile } = await supabase
    .from("profiles")
    .select("created_at")
    .eq("id", user.id)
    .maybeSingle();

  let remainingTrialDays = TRIAL_DAYS;
  const createdAt = (profile as { created_at: string } | null)?.created_at;
  if (createdAt) {
    const daysSinceSignup = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
    remainingTrialDays = Math.max(0, Math.ceil(TRIAL_DAYS - daysSinceSignup));
  }

  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: remainingTrialDays > 0 ? { trial_period_days: remainingTrialDays } : undefined,
    customer_email: user.email,
    client_reference_id: user.id,
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/app?subscribed=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/app?settings=1`,
    metadata: { user_id: user.id },
  });

  return NextResponse.json({ url: session.url });
}
