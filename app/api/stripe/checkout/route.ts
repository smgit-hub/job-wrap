export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Unavailable" }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId) return NextResponse.json({ error: "Price not configured" }, { status: 500 });

  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: { trial_period_days: 14 },
    customer_email: user.email,
    client_reference_id: user.id,
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/app?subscribed=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/app?settings=1`,
    metadata: { user_id: user.id },
  });

  return NextResponse.json({ url: session.url });
}
