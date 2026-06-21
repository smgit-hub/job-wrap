import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import AdminShell, { type AdminUser, type AdminStats } from "./AdminShell";

export const metadata = { title: "Admin — JobWrap" };

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

export default async function AdminPage() {
  const supabase = await getSupabaseServerClient();
  if (!supabase) redirect("/login");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdminUser(user)) redirect("/app");

  const service = getServiceClient();
  if (!service) {
    return <div className="p-8 text-red-600">Service role key not configured.</div>;
  }

  const [authUsersRes, profilesRes, reportsRes, businessRes] = await Promise.all([
    service.auth.admin.listUsers({ perPage: 1000 }),
    service.from("profiles").select("id, created_at").order("created_at", { ascending: false }),
    service.from("reports").select("user_id, created_at, deleted_at, updated_at"),
    service.from("business_settings").select("user_id, business_name"),
  ]);

  const authUsers = authUsersRes.data?.users ?? [];
  const profiles = profilesRes.data ?? [];
  const reports = reportsRes.data ?? [];
  const businesses = businessRes.data ?? [];

  const businessMap = Object.fromEntries(businesses.map((b) => [b.user_id, b.business_name ?? ""]));

  const reportsByUser = reports.reduce<Record<string, { total: number; active: number }>>((acc, r) => {
    if (!acc[r.user_id]) acc[r.user_id] = { total: 0, active: 0 };
    acc[r.user_id].total++;
    if (!r.deleted_at) acc[r.user_id].active++;
    return acc;
  }, {});

  const now = Date.now();
  const ms7d = 7 * 24 * 60 * 60 * 1000;
  const ms30d = 30 * 24 * 60 * 60 * 1000;

  // Build per-user data using auth users (has last_sign_in_at + banned_until)
  const adminUsers: AdminUser[] = authUsers.map((au) => {
    const rpts = reportsByUser[au.id];
    return {
      id: au.id,
      email: au.email ?? "",
      businessName: businessMap[au.id] ?? "",
      joinedAt: au.created_at,
      lastSignIn: au.last_sign_in_at ?? null,
      disabled: !!au.banned_until,
      reportCount: rpts?.total ?? 0,
      activeReportCount: rpts?.active ?? 0,
    };
  });

  const newUsers7d = authUsers.filter((u) => now - new Date(u.created_at).getTime() < ms7d).length;
  const newUsers30d = authUsers.filter((u) => now - new Date(u.created_at).getTime() < ms30d).length;
  const activeUsers30d = authUsers.filter((u) =>
    u.last_sign_in_at && now - new Date(u.last_sign_in_at).getTime() < ms30d
  ).length;

  const totalReports = reports.filter((r) => !r.deleted_at).length;

  const stats: AdminStats = {
    totalUsers: authUsers.length,
    activeUsers30d,
    newUsers7d,
    newUsers30d,
    totalReports,
    activeReports: totalReports,
  };

  return <AdminShell users={adminUsers} stats={stats} />;
}
