import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

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

  const [profilesRes, reportsRes, businessRes] = await Promise.all([
    service.from("profiles").select("*").order("created_at", { ascending: false }),
    service.from("reports").select("user_id, created_at, deleted_at").order("created_at", { ascending: false }),
    service.from("business_settings").select("user_id, business_name"),
  ]);

  const profiles = profilesRes.data ?? [];
  const reports = reportsRes.data ?? [];
  const businesses = businessRes.data ?? [];

  const businessMap = Object.fromEntries(businesses.map((b) => [b.user_id, b.business_name]));

  const reportsByUser = reports.reduce<Record<string, { total: number; active: number }>>((acc, r) => {
    if (!acc[r.user_id]) acc[r.user_id] = { total: 0, active: 0 };
    acc[r.user_id].total++;
    if (!r.deleted_at) acc[r.user_id].active++;
    return acc;
  }, {});

  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  const activeUserIds = new Set(
    reports
      .filter((r) => new Date(r.created_at).getTime() > thirtyDaysAgo && !r.deleted_at)
      .map((r) => r.user_id)
  );

  const totalReports = reports.filter((r) => !r.deleted_at).length;
  const activeUsers = profiles.filter((p) => activeUserIds.has(p.id)).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <a href="/app" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 mb-6 transition-colors">
          ← Back to app
        </a>
        <h1 className="text-2xl font-extrabold text-slate-900 mb-1">Admin</h1>
        <p className="text-slate-400 text-sm mb-10">JobWrap usage overview</p>

        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          <StatCard label="Total users" value={profiles.length} />
          <StatCard label="Active (30d)" value={activeUsers} />
          <StatCard label="Total reports" value={totalReports} />
          <StatCard label="Avg reports/user" value={profiles.length ? Math.round(totalReports / profiles.length) : 0} />
        </div>

        {/* User table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-900">Users</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-slate-400 text-xs">
                  <th className="px-6 py-3 font-medium">Email</th>
                  <th className="px-6 py-3 font-medium">Business</th>
                  <th className="px-6 py-3 font-medium">Joined</th>
                  <th className="px-6 py-3 font-medium text-right">Reports</th>
                  <th className="px-6 py-3 font-medium text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {profiles.map((p) => {
                  const rpts = reportsByUser[p.id];
                  const isActive = activeUserIds.has(p.id);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-slate-800 font-medium">{p.email}</td>
                      <td className="px-6 py-4 text-slate-500">{businessMap[p.id] ?? "—"}</td>
                      <td className="px-6 py-4 text-slate-400 whitespace-nowrap">
                        {new Date(p.created_at).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-6 py-4 text-right text-slate-700">
                        {rpts ? `${rpts.active} / ${rpts.total}` : "0"}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${isActive ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-400"}`}>
                          {isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {profiles.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">No users yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-xs text-slate-300 mt-6 text-center">Active = created a report in the last 30 days · Reports shown as active / total</p>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 px-5 py-5">
      <p className="text-slate-400 text-xs font-medium mb-1">{label}</p>
      <p className="text-3xl font-extrabold text-slate-900">{value}</p>
    </div>
  );
}
