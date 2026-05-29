"use client";

import { useEffect, useState } from "react";
import { Plus, FileText, ClipboardCheck, Settings, LogOut, Trash2, ChevronRight, CheckCircle2, Clock, ChevronLeft, FileCheck2, FileClock, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ServiceReport } from "@/types/report";
import { SERVICE_TYPE_LABELS } from "@/types/report";
import { getReports, deleteReport, getBusinessProfile, migrateCustomersFromReports, seedSampleData, DEFAULT_BUSINESS } from "@/lib/storage";
import type { BusinessProfile } from "@/types/report";
import { useAuth } from "@/components/auth/AuthProvider";
import { cn } from "@/lib/utils";

interface DashboardProps {
  onNewReport: () => void;
  onOpenReport: (report: ServiceReport) => void;
  onSettings: () => void;
  onCustomers: () => void;
}

type View = "dashboard" | "completed" | "drafts";

const RECENT_LIMIT = 5;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

// ── Shared job card ────────────────────────────────────────────────────────────
function JobCard({
  report,
  onOpen,
  onDelete,
  showStatus = false,
}: {
  report: ServiceReport;
  onOpen: (r: ServiceReport) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
  showStatus?: boolean;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(report)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onOpen(report); }}
      className="w-full text-left bg-white rounded-2xl shadow-card hover:shadow-card-hover active:scale-[0.99] transition-all overflow-hidden cursor-pointer"
    >
      <div className="flex items-center gap-3 p-4">
        <div className={cn(
          "w-11 h-11 rounded-2xl flex items-center justify-center shrink-0",
          report.status === "complete" ? "bg-green-50" : "bg-amber-50"
        )}>
          {report.status === "complete"
            ? <FileCheck2 className="w-5 h-5 text-green-500" />
            : <FileClock className="w-5 h-5 text-amber-500" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-900 truncate leading-snug">
            {report.job.customerName || "Unknown customer"}
          </p>
          <p className="text-xs text-slate-500 truncate mt-0.5">
            {SERVICE_TYPE_LABELS[report.job.serviceType]}
            {report.job.serviceAddress ? ` · ${report.job.serviceAddress}` : ""}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            {formatDate(report.job.jobDate)}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {showStatus && (
            <Badge
              className={cn(
                "text-[11px] font-semibold border-0",
                report.status === "complete"
                  ? "bg-green-100 text-green-700"
                  : "bg-amber-100 text-amber-700"
              )}
            >
              {report.status === "complete" ? "Complete" : "Draft"}
            </Badge>
          )}
          <button
            onClick={(e) => onDelete(e, report.id)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-400 hover:bg-red-50 active:bg-red-100 transition-colors"
            aria-label="Delete report"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <ChevronRight className="w-4 h-4 text-slate-300" />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard({ onNewReport, onOpenReport, onSettings, onCustomers }: DashboardProps) {
  const [reports, setReports] = useState<ServiceReport[]>([]);
  const [view, setView] = useState<View>("dashboard");
  const [profile, setProfile] = useState<BusinessProfile>(DEFAULT_BUSINESS);
  const { user, signOut } = useAuth();
  const firstName = profile.technicianName.split(" ")[0];

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfile(getBusinessProfile());
    seedSampleData();
    migrateCustomersFromReports();
    // seedSampleData is async (dynamic import) — reload reports after a tick
    // so the dashboard renders with the samples on first launch
    setTimeout(() => {
      setReports(getReports());
    }, 50);
  }, []);

  const sorted = [...reports].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  const complete = sorted.filter((r) => r.status === "complete");
  const drafts = sorted.filter((r) => r.status === "draft");
  const recent = sorted.slice(0, RECENT_LIMIT);

  function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    deleteReport(id);
    setReports((prev) => prev.filter((r) => r.id !== id));
  }

  // ── Folder view (Completed or Drafts) ──────────────────────────────────────
  if (view === "completed" || view === "drafts") {
    const isCompleted = view === "completed";
    const folderJobs = isCompleted ? complete : drafts;
    const title = isCompleted ? "Completed" : "Drafts";
    return (
      <div className="min-h-screen bg-slate-100 animate-screen-enter">
        {/* Folder header */}
        <header className="bg-white border-b border-slate-100 sticky top-0 z-10 shrink-0">
          <div className="max-w-lg lg:max-w-4xl mx-auto px-4 py-3 flex items-center">
            <button
              onClick={() => setView("dashboard")}
              className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 active:bg-slate-200 transition-colors"
              aria-label="Back"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div className="flex-1 flex items-center gap-2 ml-3">
              <span className="font-bold text-slate-900">{title}</span>
              <span className="bg-slate-900 text-white text-[11px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                {folderJobs.length}
              </span>
            </div>
          </div>
        </header>

        <main className="max-w-lg lg:max-w-4xl mx-auto px-4 py-5 pb-10">
          {folderJobs.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center shadow-card mt-2">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-7 h-7 text-slate-300" />
              </div>
              <p className="text-slate-800 text-sm font-semibold">
                {isCompleted ? "No completed jobs yet" : "No drafts"}
              </p>
              <p className="text-slate-400 text-sm mt-1 leading-relaxed">
                {isCompleted
                  ? "Finished jobs will appear here."
                  : "Jobs saved as draft will appear here."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 lg:gap-3 mt-2">
              {folderJobs.map((report) => (
                <JobCard
                  key={report.id}
                  report={report}
                  onOpen={onOpenReport}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    );
  }

  // ── Main dashboard ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-100 animate-screen-enter">
      {/* Header — mobile only; desktop uses the sidebar */}
      <header className="lg:hidden bg-white border-b border-slate-100 sticky top-0 z-10 shrink-0">
        <div className="max-w-lg mx-auto px-4 flex items-center justify-between py-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 leading-tight tracking-tight">JobWrap</p>
              {profile.businessName && (
                <p className="text-xs text-slate-400 leading-tight">{profile.businessName}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-0.5">
            <button
              onClick={onCustomers}
              className="w-9 h-9 rounded-xl flex items-center justify-center active:bg-slate-100 transition-colors"
              aria-label="Customers"
            >
              <Users className="w-4 h-4 text-slate-400" />
            </button>
            <button
              onClick={onSettings}
              className="w-9 h-9 rounded-xl flex items-center justify-center active:bg-slate-100 transition-colors"
              aria-label="Settings"
            >
              <Settings className="w-4 h-4 text-slate-400" />
            </button>
            {user && (
              <button
                onClick={async () => { await signOut(); window.location.href = "/login"; }}
                className="w-9 h-9 rounded-xl flex items-center justify-center active:bg-slate-100 transition-colors"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4 text-slate-300" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-lg lg:max-w-4xl mx-auto px-4 pt-5 lg:pt-8 pb-6 space-y-5 lg:space-y-6">
        {/* Greeting */}
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {firstName ? `${getGreeting()}, ${firstName}` : `${getGreeting()}!`}
          </h1>
          {!profile.businessName ? (
            <p className="text-sm text-slate-500 mt-1">
              To get started,{" "}
              <button onClick={onSettings} className="text-orange-500 font-semibold underline underline-offset-2">
                fill in your business details
              </button>
              {" "}in Settings.
            </p>
          ) : (
            <p className="text-sm text-slate-500 mt-1">Ready to wrap up a job?</p>
          )}
        </div>

        {/* New job CTA */}
        <button
          onClick={onNewReport}
          className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white rounded-2xl h-14 flex items-center justify-center gap-2.5 font-bold text-base transition-colors shadow-md shadow-orange-200"
        >
          <Plus className="w-5 h-5" />
          New Report
        </button>

        {/* Folder cards */}
        <div className="grid grid-cols-2 gap-3">
          {/* Completed */}
          <button
            onClick={() => setView("completed")}
            className="rounded-2xl p-4 flex items-center gap-3 bg-white shadow-card hover:bg-green-50 active:scale-[0.98] transition-all"
          >
            <div className="w-10 h-10 rounded-2xl bg-green-50 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-left">
              <p className="text-2xl font-bold leading-none text-slate-900">{complete.length}</p>
              <p className="text-xs font-medium mt-1 text-slate-400">Completed</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 ml-auto" />
          </button>

          {/* Drafts */}
          <button
            onClick={() => setView("drafts")}
            className="rounded-2xl p-4 flex items-center gap-3 bg-white shadow-card hover:bg-amber-50 active:scale-[0.98] transition-all"
          >
            <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <div className="text-left">
              <p className="text-2xl font-bold leading-none text-slate-900">{drafts.length}</p>
              <p className="text-xs font-medium mt-1 text-slate-400">Drafts</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 ml-auto" />
          </button>
        </div>

        {/* Recent jobs */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Recent Jobs
            </h2>
          </div>

          {recent.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center shadow-card">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-7 h-7 text-slate-300" />
              </div>
              <p className="text-slate-800 text-sm font-semibold">No jobs yet</p>
              <p className="text-slate-400 text-sm mt-1 leading-relaxed">
                Tap New Report to write up your first job.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 lg:gap-3">
              {recent.map((report) => (
                <JobCard
                  key={report.id}
                  report={report}
                  onOpen={onOpenReport}
                  onDelete={handleDelete}
                  showStatus
                />
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
