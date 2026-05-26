"use client";

import { useState } from "react";
import Dashboard from "@/components/Dashboard";
import NewReportForm from "@/components/NewReportForm";
import ReportEditor from "@/components/ReportEditor";
import ReportPreview from "@/components/ReportPreview";
import BrandingSettings from "@/components/BrandingSettings";
import CustomerSelectScreen from "@/components/CustomerSelectScreen";
import type { ServiceReport, JobDetails, BusinessProfile, GeneratedReport, Customer } from "@/types/report";
import {
  getBusinessProfile,
  saveBusinessProfile,
  saveReport,
  clearDraft,
  generateId,
  upsertCustomerFromJob,
} from "@/lib/storage";

type Screen = "dashboard" | "customers" | "new-report" | "editor" | "preview" | "settings";

export default function Home() {
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [activeReport, setActiveReport] = useState<ServiceReport | null>(null);
  const [isNewReport, setIsNewReport] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  function handleNewReport() {
    setActiveReport(null);
    setSelectedCustomer(null);
    setScreen("new-report");
  }

  function handleOpenReport(report: ServiceReport) {
    // Always use current branding when opening a report so settings changes
    // are reflected immediately without needing to regenerate.
    const withCurrentBranding = { ...report, business: getBusinessProfile() };
    setActiveReport(withCurrentBranding);
    setIsNewReport(false);
    // Completed reports land on Preview (formatted view + download).
    // Drafts land in the Editor to continue working.
    setScreen(report.status === "complete" ? "preview" : "editor");
  }

  // Async: calls the API route, throws on failure so NewReportForm can show the error
  async function handleGenerate(job: JobDetails): Promise<void> {
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
        voiceNotes: job.voiceNotes,
      }),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(data.error ?? "Report generation failed. Please try again.");
    }

    const data = (await response.json()) as { report: GeneratedReport };

    const report: ServiceReport = {
      id: generateId(),
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      business,
      job,
      report: data.report,
    };

    // Auto-save / update the customer record from confirmed job details
    upsertCustomerFromJob(job);

    saveReport(report);
    clearDraft();
    setActiveReport(report);
    setIsNewReport(true);
    setScreen("editor");
  }

  async function handleRegenerate(job: JobDetails): Promise<GeneratedReport> {
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
        voiceNotes: job.voiceNotes,
      }),
    });
    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(data.error ?? "Regeneration failed. Please try again.");
    }
    const data = (await response.json()) as { report: GeneratedReport };
    return data.report;
  }

  function handlePreview(report: ServiceReport) {
    setActiveReport(report);
    setScreen("preview");
  }

  function handleSaveSettings(profile: BusinessProfile) {
    saveBusinessProfile(profile);
    // Propagate new branding to any report currently in memory
    if (activeReport) {
      setActiveReport({ ...activeReport, business: profile });
    }
    setScreen("dashboard");
  }

  return (
    <>
      {screen === "dashboard" && (
        <Dashboard
          onNewReport={handleNewReport}
          onOpenReport={handleOpenReport}
          onSettings={() => setScreen("settings")}
          onCustomers={() => setScreen("customers")}
        />
      )}

      {screen === "customers" && (
        <CustomerSelectScreen
          standalone
          onBack={() => setScreen("dashboard")}
          onSelectCustomer={(customer) => {
            setSelectedCustomer(customer);
            setScreen("new-report");
          }}
          onNewCustomer={() => {
            setSelectedCustomer(null);
            setScreen("new-report");
          }}
        />
      )}

      {screen === "new-report" && (
        <NewReportForm
          initialCustomer={selectedCustomer}
          onBack={() => setScreen("dashboard")}
          onGenerate={handleGenerate}
          onSaveForLater={() => setScreen("dashboard")}
        />
      )}

      {screen === "editor" && activeReport && (
        <ReportEditor
          report={activeReport}
          isNewReport={isNewReport}
          onBack={() => setScreen("dashboard")}
          onPreview={handlePreview}
          onRegenerate={handleRegenerate}
        />
      )}

      {screen === "preview" && activeReport && (
        <ReportPreview
          report={activeReport}
          isNewReport={isNewReport}
          onBack={isNewReport ? () => setScreen("editor") : () => setScreen("dashboard")}
          onEdit={() => setScreen("editor")}
          onDone={() => setScreen("dashboard")}
        />
      )}

      {screen === "settings" && (
        <BrandingSettings
          profile={getBusinessProfile()}
          onBack={() => setScreen("dashboard")}
          onSave={handleSaveSettings}
        />
      )}
    </>
  );
}
