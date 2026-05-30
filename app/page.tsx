"use client";

import { useState } from "react";
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
import type { ServiceReport, JobDetails, BusinessProfile, GeneratedReport, Customer } from "@/types/report";
import {
  getBusinessProfile,
  saveBusinessProfile,
  saveReport,
  clearDraft,
  generateId,
  upsertCustomerFromJob,
  purgeExpiredDeletedReports,
} from "@/lib/storage";

type Screen = "dashboard" | "reports" | "customers" | "customer-profile" | "new-report" | "editor" | "preview" | "settings";

function getActiveSection(screen: Screen): ActiveSection {
  if (screen === "reports") return "reports";
  if (screen === "customers" || screen === "customer-profile") return "customers";
  if (screen === "settings") return "settings";
  return "dashboard";
}

export default function Home() {
  // ── TODO: AppGild license gate ──────────────────────────────────────────────
  // INSERT the AppGild license verification snippet HERE, before any app content
  // is rendered. AppGild wraps this component (or returns a paywall/unlock screen
  // instead) if the user has not purchased or activated a license.
  //
  // Steps:
  //   1. Install the AppGild SDK: npm install @appgild/react  (or the equivalent package)
  //   2. Add your AppGild product key to .env.local:
  //        NEXT_PUBLIC_APPGILD_KEY=your-product-key
  //   3. Replace this comment block with the AppGild gate, e.g.:
  //        import { AppGildGate } from "@appgild/react";
  //        // ... inside Home():
  //        return <AppGildGate productKey={process.env.NEXT_PUBLIC_APPGILD_KEY!}>
  //                 {/* existing JSX */}
  //               </AppGildGate>;
  //   4. Test in both licensed and unlicensed states before releasing.
  // ── end AppGild TODO ────────────────────────────────────────────────────────

  // Purge reports that have been in trash for more than 7 days
  useState(() => { purgeExpiredDeletedReports(); });

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
    const response = await fetch("/api/generate-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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

      {/* Content — offset right of sidebar on desktop */}
      <div className="lg:pl-60">

      {screen === "dashboard" && (
        <Dashboard
          onNewReport={handleNewReport}
          onOpenReport={handleOpenReport}
          onSettings={() => goToScreen("settings")}
          onReports={handleOpenReports}
        />
      )}

      {screen === "reports" && (
        <Reports
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
    </>
  );
}
