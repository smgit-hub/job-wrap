"use client";

import { useState, useEffect } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import Dashboard from "@/components/Dashboard";
import Reports from "@/components/Reports";
import type { ReportsFilter } from "@/components/Reports";
import NewReportForm from "@/components/NewReportForm";
import ReportEditor from "@/components/ReportEditor";
import ReportPreview from "@/components/ReportPreview";
import BrandingSettings from "@/components/BrandingSettings";
import CustomerSelectScreen from "@/components/CustomerSelectScreen";
import CustomerProfile from "@/components/CustomerProfile";
import Sidebar, { type ActiveSection } from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import InstallNudge from "@/components/InstallNudge";
import type { ServiceReport, JobDetails, BusinessProfile, GeneratedReport, Customer } from "@/types/report";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  getBusinessProfile,
  saveBusinessProfile,
  saveReport,
  saveCustomer,
  clearDraft,
  generateId,
  upsertCustomerFromJob,
  purgeExpiredDeletedReports,
  getReports,
} from "@/lib/storage";
import { dbSaveReport, syncFromSupabase, migrateLocalStorageToSupabase } from "@/lib/db";
import { incrementDemoGenCount } from "@/lib/hooks/useDemoGuard";

type Screen = "dashboard" | "reports" | "customers" | "customer-profile" | "new-report" | "editor" | "preview" | "settings";

function getActiveSection(screen: Screen): ActiveSection {
  if (screen === "reports") return "reports";
  if (screen === "customers" || screen === "customer-profile") return "customers";
  if (screen === "settings") return "settings";
  return "dashboard";
}

export default function AppShell() {
  const { user, loading: authLoading, isDemo } = useAuth();
  const isAdmin = Array.isArray(user?.app_metadata?.roles) && (user.app_metadata.roles as string[]).includes("admin");

  // Purge reports that have been in trash for more than 7 days
  useState(() => { purgeExpiredDeletedReports(); });

  // True once the startup sync has completed. Used to gate rendering when
  // localStorage is empty (fresh login) so we never flash zeros at the user.
  // If localStorage already has data, we show it immediately and sync silently.
  const [syncDone, setSyncDone] = useState(false);
  const [syncVersion, setSyncVersion] = useState(0);

  // Subscription / trial state — null = loading, false = no sub, string = status
  const [subStatus, setSubStatus] = useState<string | null | "loading">("loading");
  const [trialExpired, setTrialExpired] = useState(false);

  useEffect(() => {
    if (isDemo) {
      // Demo is localStorage-only — seed data if needed, never touch Supabase
      if (getReports().length === 0) {
        import("@/lib/sampleData").then(({ SAMPLE_REPORTS, SAMPLE_CUSTOMERS, SAMPLE_BUSINESS }) => {
          SAMPLE_REPORTS.forEach((r) => saveReport(r));
          SAMPLE_CUSTOMERS.forEach((c) => saveCustomer(c));
          saveBusinessProfile(SAMPLE_BUSINESS);
          setSyncDone(true);
          setSyncVersion(v => v + 1);
        });
      } else {
        setSyncDone(true);
        setSyncVersion(v => v + 1);
      }
      return;
    }

    migrateLocalStorageToSupabase()
      .then(() => syncFromSupabase())
      .then(() => { setSyncDone(true); setSyncVersion(v => v + 1); })
      .catch((err) => { console.warn("[AppShell] startup sync failed:", err); setSyncDone(true); });

    // Check subscription status and trial expiry
    import("@/lib/supabase/client").then(({ getSupabaseBrowserClient }) => {
      const client = getSupabaseBrowserClient();
      if (!client || !user) { setSubStatus(null); return; }

      Promise.all([
        client.from("subscriptions").select("status").eq("user_id", user.id).maybeSingle(),
        client.from("profiles").select("created_at").eq("id", user.id).maybeSingle(),
      ]).then(([subRes, profileRes]) => {
        const status = (subRes.data as { status: string } | null)?.status ?? null;
        setSubStatus(status);
        const isActive = status === "active" || status === "trialing";
        if (!isActive) {
          const createdAt = (profileRes.data as { created_at: string } | null)?.created_at;
          if (createdAt) {
            const daysSinceSignup = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
            setTrialExpired(daysSinceSignup > 14);
          }
        }
      });
    });

    // Sync when the user returns to the app/tab
    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        syncFromSupabase().then(() => setSyncVersion(v => v + 1));
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isDemo]);

  const [screen, setScreen] = useState<Screen>("dashboard");
  const [navStack, setNavStack] = useState<Screen[]>([]);
  const [activeReport, setActiveReport] = useState<ServiceReport | null>(null);
  const [isNewReport, setIsNewReport] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);
  const [reportsFilter, setReportsFilter] = useState<ReportsFilter>("all");

  // ── Navigation helpers ────────────────────────────────────────────────────────

  function pushScreen(to: Screen) {
    setNavStack(prev => [...prev, screen]);
    setScreen(to);
  }

  function popScreen() {
    const destination = navStack[navStack.length - 1] ?? "dashboard";
    setNavStack(prev => prev.slice(0, -1));
    setScreen(destination);
  }

  function goToScreen(to: Screen) {
    setNavStack([]);
    setScreen(to);
  }

  // ── Screen handlers ───────────────────────────────────────────────────────────

  function handleNewReport() {
    setActiveReport(null);
    setSelectedCustomer(null);
    pushScreen("new-report");
  }

  function handleOpenReports(filter: ReportsFilter = "all") {
    setReportsFilter(filter);
    goToScreen("reports");
  }

  function handleOpenReport(report: ServiceReport) {
    const withCurrentBranding = { ...report, business: getBusinessProfile() };
    setActiveReport(withCurrentBranding);
    setIsNewReport(false);
    pushScreen(report.status === "complete" ? "preview" : "editor");
  }

  async function callGenerateApi(job: JobDetails): Promise<GeneratedReport> {
    const business = getBusinessProfile();

    // Demo: fetch is intercepted — no token needed, no real network call
    const accessToken = isDemo ? null : await (async () => {
      const { getSupabaseBrowserClient } = await import("@/lib/supabase/client");
      const supabaseClient = getSupabaseBrowserClient();
      return supabaseClient
        ? (await supabaseClient.auth.getSession()).data.session?.access_token ?? null
        : null;
    })();

    const response = await fetch("/api/generate-report", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { "Authorization": `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({
        serviceType: job.serviceType,
        customServiceType: job.customServiceType,
        customerName: job.customerName,
        technicianName: business.technicianName,
        jobDate: job.jobDate,
        equipment: job.equipment,
        voiceNotes: job.voiceNotes,
      }),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(data.error ?? "Report generation failed. Please try again.");
    }

    const data = (await response.json()) as { report: GeneratedReport };

    if (!data.report.customerSummary && !data.report.workPerformed) {
      throw new Error(
        "Your notes don't have enough detail to generate a report. Try describing the specific tasks you completed on site."
      );
    }

    return data.report;
  }

  async function handleGenerate(job: JobDetails): Promise<void> {
    const generatedReport = await callGenerateApi(job);
    if (isDemo) incrementDemoGenCount();

    const report: ServiceReport = {
      id: generateId(),
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      business: getBusinessProfile(),
      job,
      report: generatedReport,
    };

    upsertCustomerFromJob(job);
    saveReport(report);
    if (!isDemo) {
      dbSaveReport(report).catch((err) => console.error("[AppShell] Supabase save failed:", err));
    }
    clearDraft();
    setActiveReport(report);
    setIsNewReport(true);
    setScreen("editor");
  }

  async function handleRegenerate(job: JobDetails): Promise<GeneratedReport> {
    return callGenerateApi(job);
  }

  function handlePreview(report: ServiceReport) {
    setActiveReport(report);
    pushScreen("preview");
  }

  function handleSaveSettings(profile: BusinessProfile) {
    saveBusinessProfile(profile);
    if (activeReport) {
      setActiveReport({ ...activeReport, business: profile });
    }
    goToScreen("dashboard");
  }

  // Show loading screen until auth, sync, and subscription check all complete.
  if (authLoading || !syncDone || (!isDemo && !isAdmin && subStatus === "loading")) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center gap-5 text-center">
        <div className="w-20 h-20 rounded-3xl bg-orange-50 flex items-center justify-center">
          <Sparkles className="w-10 h-10 text-orange-400 animate-pulse" />
        </div>
        <div className="space-y-1">
          <p className="font-bold text-slate-900 text-lg">JobWrap</p>
          <p className="text-sm text-slate-500">Getting things ready…</p>
        </div>
        <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />
      </div>
    );
  }

  if (!isDemo && !isAdmin && trialExpired) {
    return <PaywallScreen />;
  }

  return (
    <>
      <Sidebar
        activeSection={getActiveSection(screen)}
        onDashboard={() => goToScreen("dashboard")}
        onReports={() => handleOpenReports("all")}
        onCustomers={() => goToScreen("customers")}
        onSettings={() => goToScreen("settings")}
      />

      <BottomNav
        activeSection={getActiveSection(screen)}
        onDashboard={() => goToScreen("dashboard")}
        onReports={() => handleOpenReports("all")}
        onNewReport={handleNewReport}
        onCustomers={() => goToScreen("customers")}
        onSettings={() => goToScreen("settings")}
      />

      {/* Content — offset right of sidebar on desktop, pushed down by demo banner when active */}
      <div className={`lg:pl-60${isDemo ? " pt-10" : ""}`}>

        {screen === "dashboard" && (
          <Dashboard
            key={syncVersion}
            onNewReport={handleNewReport}
            onOpenReport={handleOpenReport}
            onSettings={() => goToScreen("settings")}
            onReports={handleOpenReports}
          />
        )}

        {screen === "reports" && (
          <Reports
            key={syncVersion}
            initialFilter={reportsFilter}
            onOpenReport={handleOpenReport}
          />
        )}

        {screen === "customers" && (
          <CustomerSelectScreen
            standalone
            onBack={() => goToScreen("dashboard")}
            onSelectCustomer={(customer) => {
              setActiveCustomer(customer);
              pushScreen("customer-profile");
            }}
            onNewCustomer={() => {
              setSelectedCustomer(null);
              pushScreen("new-report");
            }}
          />
        )}

        {screen === "customer-profile" && activeCustomer && (
          <CustomerProfile
            customer={activeCustomer}
            onBack={popScreen}
            onStartJob={(customer) => {
              setSelectedCustomer(customer);
              pushScreen("new-report");
            }}
            onOpenReport={handleOpenReport}
            onCustomerUpdated={(updated) => setActiveCustomer(updated)}
          />
        )}

        {screen === "new-report" && (
          <NewReportForm
            initialCustomer={selectedCustomer}
            onBack={() => { clearDraft(); popScreen(); }}
            onGenerate={handleGenerate}
            onSaveForLater={() => goToScreen("dashboard")}
          />
        )}

        {screen === "editor" && activeReport && (
          <ReportEditor
            report={activeReport}
            isNewReport={isNewReport}
            onBack={popScreen}
            onPreview={handlePreview}
            onRegenerate={handleRegenerate}
          />
        )}

        {screen === "preview" && activeReport && (
          <ReportPreview
            report={activeReport}
            isNewReport={isNewReport}
            onBack={popScreen}
            onEdit={() => pushScreen("editor")}
            onDone={() => goToScreen("dashboard")}
          />
        )}

        {screen === "settings" && (
          <BrandingSettings
            profile={getBusinessProfile()}
            onBack={() => goToScreen("dashboard")}
            onSave={handleSaveSettings}
          />
        )}

      </div>

      <InstallNudge />
    </>
  );
}

function PaywallScreen() {
  const [loading, setLoading] = useState(false);

  async function startCheckout() {
    setLoading(true);
    const res = await fetch("/api/stripe/checkout", { method: "POST" });
    const { url } = await res.json();
    if (url) window.location.href = url;
    else setLoading(false);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-5">
      <div className="max-w-sm w-full space-y-6 text-center">
        <div className="flex items-center justify-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-192.png?v=3" alt="JobWrap" className="w-10 h-10 rounded-xl object-cover" />
          <span className="text-2xl font-bold text-slate-900">JobWrap</span>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-slate-900">Your trial has ended</h1>
          <p className="text-slate-500 text-sm leading-relaxed">
            Subscribe to keep full access to JobWrap — unlimited reports, AI generation, and PDF export.
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 text-left space-y-3">
          <div className="flex items-end gap-1">
            <span className="text-3xl font-extrabold text-slate-900">$9</span>
            <span className="text-slate-400 text-sm mb-1">/ month</span>
          </div>
          <ul className="space-y-2 text-sm text-slate-600">
            {["Unlimited reports", "AI report generation", "Branded PDF export", "Cancel any time"].map((f) => (
              <li key={f} className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-orange-100 flex items-center justify-center shrink-0 text-orange-600 text-xs">✓</span>
                {f}
              </li>
            ))}
          </ul>
        </div>
        <button
          onClick={startCheckout}
          disabled={loading}
          className="w-full h-12 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold transition-colors"
        >
          {loading ? "Redirecting…" : "Subscribe now"}
        </button>
        <p className="text-xs text-slate-400">14-day refund guarantee · Secure payment via Stripe</p>
      </div>
    </div>
  );
}
