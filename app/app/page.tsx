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

export default function Home() {
  // ── TODO: AppGild license gate ──────────────────────────────────────────────
  // The AppGild snippet (~20 lines of JS) goes in app/layout.tsx, NOT here.
  // It must fire on every route including /login so unlicensed users are blocked
  // before they see anything.
  //
  // Public routes to EXCLUDE from the snippet:
  //   - /demo      — buyers try before purchasing (no licence needed)
  //   - /r/[token] — customer-facing share links
  //   - /privacy   — privacy policy
  //   - /terms     — terms of service
  //
  // How it works (per AppGild):
  //   1. Buyer subscribes on AppGild → JobWrap appears in their dashboard
  //   2. They click Open → sent to your live URL with licence key attached
  //   3. Snippet calls /api/license/verify, confirms key is active → lets them in
  //   4. They sign into / create their JobWrap account as normal
  //   5. If subscription lapses → snippet blocks access automatically
  //
  // Steps to integrate:
  //   1. Go through the AppGild upload wizard to Step 5
  //   2. Copy the customised snippet (it includes your app slug)
  //   3. Paste it into app/layout.tsx, excluding the public routes above
  //   4. Add your AppGild product key to .env.local:
  //        NEXT_PUBLIC_APPGILD_KEY=your-product-key
  //   5. Redeploy and click "Run integration check" in the wizard
  // ── end AppGild TODO ────────────────────────────────────────────────────────

  const { user, signOut, loading: authLoading } = useAuth();

  // Purge reports that have been in trash for more than 7 days
  useState(() => { purgeExpiredDeletedReports(); });

  // True once the startup sync has completed. Used to gate rendering when
  // localStorage is empty (fresh login) so we never flash zeros at the user.
  // If localStorage already has data, we show it immediately and sync silently.
  const [syncDone, setSyncDone] = useState(false);
  const [syncVersion, setSyncVersion] = useState(0);

  // On mount: migrate any existing localStorage data to Supabase,
  // then sync the latest cloud data back into the localStorage cache.
  useEffect(() => {
    migrateLocalStorageToSupabase()
      .then(() => syncFromSupabase())
      .then(async () => {
        // If the demo account has no reports, seed sample data and push to Supabase
        if (user?.email === "demo@jobwrap.app" && getReports().length === 0) {
          const { SAMPLE_REPORTS, SAMPLE_CUSTOMERS, SAMPLE_BUSINESS } = await import("@/lib/sampleData");
          SAMPLE_REPORTS.forEach((r) => saveReport(r));
          SAMPLE_CUSTOMERS.forEach((c) => saveCustomer(c));
          await Promise.all(SAMPLE_REPORTS.map((r) => dbSaveReport(r)));
          // Only seed business settings if not already configured
          const { getSupabaseBrowserClient } = await import("@/lib/supabase/client");
          const sbClient = getSupabaseBrowserClient();
          if (sbClient) {
            const { data: { user: u } } = await sbClient.auth.getUser();
            if (u) {
              const { loadBusinessSettingsFromDb, saveBusinessSettingsToDb } = await import("@/lib/supabase/queries/businessSettings");
              const existing = await loadBusinessSettingsFromDb(u.id);
              if (!existing?.businessName) {
                saveBusinessProfile(SAMPLE_BUSINESS);
                await saveBusinessSettingsToDb(SAMPLE_BUSINESS, u.id);
              }
            }
          }
        }
      })
      .then(() => { setSyncDone(true); setSyncVersion(v => v + 1); })
      .catch((err) => { console.warn("[page] startup sync failed:", err); setSyncDone(true); });

    // Sync when the user returns to the app/tab
    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        syncFromSupabase().then(() => setSyncVersion(v => v + 1));
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const [screen, setScreen] = useState<Screen>("dashboard");
  const [navStack, setNavStack] = useState<Screen[]>([]);
  const [activeReport, setActiveReport] = useState<ServiceReport | null>(null);
  const [isNewReport, setIsNewReport] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);
  const [reportsFilter, setReportsFilter] = useState<ReportsFilter>("all");

  // ── Navigation helpers ────────────────────────────────────────────────────────

  // Forward — records where we came from so back knows where to return.
  function pushScreen(to: Screen) {
    setNavStack(prev => [...prev, screen]);
    setScreen(to);
  }

  // Back — returns to wherever we came from, or dashboard if the stack is empty.
  function popScreen() {
    const destination = navStack[navStack.length - 1] ?? "dashboard";
    setNavStack(prev => prev.slice(0, -1));
    setScreen(destination);
  }

  // Top-level — clears history. Used by nav tabs and "Done / Save" actions.
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
    // Always use current branding when opening a report so settings changes
    // are reflected immediately without needing to regenerate.
    const withCurrentBranding = { ...report, business: getBusinessProfile() };
    setActiveReport(withCurrentBranding);
    setIsNewReport(false);
    // Completed reports land on Preview (formatted view + download).
    // Drafts land in the Editor to continue working.
    pushScreen(report.status === "complete" ? "preview" : "editor");
  }

  // Shared helper: POST to /api/generate-report and return the GeneratedReport.
  // Throws on HTTP errors or when the AI returns an empty report (notes too brief).
  async function callGenerateApi(job: JobDetails): Promise<GeneratedReport> {
    const business = getBusinessProfile();

    // Get the access token to pass in the Authorization header.
    // This ensures the API route can authenticate the request even when
    // the session cookie is not available (e.g. iOS PWA).
    const { getSupabaseBrowserClient } = await import("@/lib/supabase/client");
    const supabaseClient = getSupabaseBrowserClient();
    const accessToken = supabaseClient
      ? (await supabaseClient.auth.getSession()).data.session?.access_token
      : null;

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

    // All-empty fields means the notes were too brief for the AI to work with.
    if (!data.report.customerSummary && !data.report.workPerformed) {
      throw new Error(
        "Your notes don't have enough detail to generate a report. Try describing the specific tasks you completed on site."
      );
    }

    return data.report;
  }

  async function handleGenerate(job: JobDetails): Promise<void> {
    const generatedReport = await callGenerateApi(job);
    if (user?.email === "demo@jobwrap.app") incrementDemoGenCount();

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
    saveReport(report);          // localStorage — instant, synchronous
    dbSaveReport(report).catch((err) => console.error("[handleGenerate] Supabase save failed:", err));
    clearDraft();
    setActiveReport(report);
    setIsNewReport(true);
    // Replace the new-report screen with the editor — don't push so that back
    // from the editor returns to wherever the user was before starting the form.
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
    // Propagate new branding to any report currently in memory
    if (activeReport) {
      setActiveReport({ ...activeReport, business: profile });
    }
    goToScreen("dashboard");
  }

  // Show loading screen until auth resolves and the initial sync completes.
  if (authLoading || !syncDone) {
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

  return (
    <>

      <Sidebar
        activeSection={getActiveSection(screen)}
        onDashboard={() => goToScreen("dashboard")}
        onReports={() => handleOpenReports("all")}
        onCustomers={() => goToScreen("customers")}
        onSettings={() => goToScreen("settings")}
      />

      {/* Bottom nav — mobile only, always visible (sticky footers use .above-nav to float above it) */}
      <BottomNav
        activeSection={getActiveSection(screen)}
        onDashboard={() => goToScreen("dashboard")}
        onReports={() => handleOpenReports("all")}
        onNewReport={handleNewReport}
        onCustomers={() => goToScreen("customers")}
        onSettings={() => goToScreen("settings")}
      />

      {/* Content — offset right of sidebar on desktop, pushed down by top banner */}
      <div className="lg:pl-60 pt-10">

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

      {/* Standalone customer management — accessed from the sidebar/bottom nav */}
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

      </div>{/* end lg:pl-60 content wrapper */}

      <InstallNudge />
    </>
  );
}
