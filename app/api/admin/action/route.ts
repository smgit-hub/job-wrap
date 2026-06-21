import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

function isAdminUser(user: { app_metadata?: Record<string, unknown> }) {
  const roles = user.app_metadata?.roles;
  return Array.isArray(roles) && roles.includes("admin");
}

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient<Database>(url, key, { auth: { persistSession: false } });
}

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdminUser(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const service = getServiceClient();
  if (!service) return NextResponse.json({ error: "Service role not configured" }, { status: 500 });

  const { action, userId } = await req.json() as { action: string; userId: string };

  if (!userId || typeof userId !== "string") {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  // Prevent acting on yourself
  if (userId === user.id) {
    return NextResponse.json({ error: "Cannot perform this action on your own account" }, { status: 400 });
  }

  if (action === "disable") {
    const { error } = await service.auth.admin.updateUserById(userId, {
      ban_duration: "876600h", // ~100 years
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "enable") {
    const { error } = await service.auth.admin.updateUserById(userId, {
      ban_duration: "none",
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "delete") {
    const { error } = await service.auth.admin.deleteUser(userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
