"use client";

import { useEffect, useState } from "react";
import { Plus, FileText, ChevronRight, CheckCircle2, Clock } from "lucide-react";
import type { ServiceReport } from "@/types/report";
import { getReports, deleteReport, getBusinessProfile, migrateCustomersFromReports, seedSampleData, DEFAULT_BUSINESS } from "@/lib/storage";
import type { BusinessProfile } from "@/types/report";
import { JobCard } from "@/components/JobCard";
import type { ReportsFilter } from "@/components/Reports";

interface DashboardProps {
  onNewReport: () => void;
  onOpenReport: (report: ServiceReport) => void;
  onSettings: () => void;
  onReports: (filter: ReportsFilter) => void;
}

const RECENT_LIMIT = 5;

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard({ onNewReport, onOpenReport, onSettings, onReports }: DashboardProps) {
  const [reports, setReports] = useState<ServiceReport[]>([]);
  const [profile, setProfile] = useState<BusinessProfile>(DEFAULT_BUSINESS);
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

  // ── Main dashboard ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-100 animate-screen-enter">
      <main className="max-w-lg lg:max-w-4xl mx-auto px-4 pt-10 lg:pt-8 pb-28 lg:pb-8 space-y-5 lg:space-y-6">
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
            onClick={() => onReports("complete")}
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
            onClick={() => onReports("draft")}
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
