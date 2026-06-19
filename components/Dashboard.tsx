"use client";

import { useEffect, useState, useMemo } from "react";
import { FileText, ChevronRight, CheckCircle2, Clock, Calendar, Mic, ArrowRight } from "lucide-react";
import type { ServiceReport, BusinessProfile } from "@/types/report";
import { SERVICE_TYPE_LABELS } from "@/types/report";
import { getReports, getBusinessProfile, migrateCustomersFromReports, DEFAULT_BUSINESS } from "@/lib/storage";
import { dbDeleteReport } from "@/lib/db";
import { JobCard } from "@/components/JobCard";
import type { ReportsFilter } from "@/components/Reports";
import { cn } from "@/lib/utils";

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

function daysUntil(dateStr: string): number {
  const due = new Date(dateStr);
  due.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function serviceDueLabel(dateStr: string): { text: string; overdue: boolean } {
  const days = daysUntil(dateStr);
  if (days < 0)  return { text: `${Math.abs(days)}d overdue`, overdue: true };
  if (days === 0) return { text: "Due today",     overdue: false };
  if (days === 1) return { text: "Due tomorrow",  overdue: false };
  if (days < 7)   return { text: `In ${days} days`, overdue: false };
  if (days < 14)  return { text: "Next week",     overdue: false };
  return { text: `In ${Math.round(days / 7)} weeks`, overdue: false };
}

export default function Dashboard({ onNewReport, onOpenReport, onSettings, onReports }: DashboardProps) {
  const [reports, setReports] = useState<ServiceReport[]>([]);
  const [profile, setProfile] = useState<BusinessProfile>(DEFAULT_BUSINESS);
  const firstName = profile.technicianName.split(" ")[0];

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfile(getBusinessProfile());
    migrateCustomersFromReports();
    setReports(getReports());
  }, []);

  const sorted = useMemo(
    () => [...reports].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    ),
    [reports]
  );

  const complete = useMemo(() => sorted.filter((r) => r.status === "complete"), [sorted]);
  const drafts   = useMemo(() => sorted.filter((r) => r.status === "draft"), [sorted]);
  const recent   = useMemo(() => sorted.slice(0, RECENT_LIMIT), [sorted]);

  // Jobs completed this calendar month
  const thisMonthCount = useMemo(() => {
    const now = new Date();
    return complete.filter((r) => {
      const d = new Date(r.updatedAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
  }, [complete]);

  // Upcoming / overdue services — nextServiceDate within 30 days or past due
  const upcoming = useMemo(
    () =>
      sorted
        .filter((r) => {
          if (!r.job.nextServiceDate) return false;
          return daysUntil(r.job.nextServiceDate) <= 30;
        })
        .sort((a, b) =>
          new Date(a.job.nextServiceDate!).getTime() - new Date(b.job.nextServiceDate!).getTime()
        )
        .slice(0, 4),
    [sorted]
  );

  function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    void dbDeleteReport(id);
    setReports((prev) => prev.filter((r) => r.id !== id));
  }

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
            <p className="text-sm text-slate-500 mt-1">Ready to wrap up a service?</p>
          )}
        </div>

        {/* New job CTA */}
        <button
          onClick={onNewReport}
          className="w-full bg-orange-500 active:bg-orange-600 text-white rounded-2xl px-5 py-4 flex items-center gap-4 transition-colors shadow-lg shadow-orange-200"
        >
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
            <Mic className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-xl font-extrabold leading-tight">New Report</p>
            <p className="text-sm text-orange-100 font-medium mt-0.5">Just talk. We handle the rest.</p>
          </div>
          <ArrowRight className="w-5 h-5 text-white/70 shrink-0" />
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
            <div className="text-left min-w-0">
              <p className="text-2xl font-bold leading-none text-slate-900">{complete.length}</p>
              <p className="text-xs font-medium mt-1 text-slate-500">Completed</p>
              {thisMonthCount > 0 && (
                <p className="text-[10px] font-semibold text-green-500 mt-0.5 leading-none">
                  {thisMonthCount} this month
                </p>
              )}
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 ml-auto shrink-0" />
          </button>

          {/* Drafts */}
          <button
            onClick={() => onReports("draft")}
            className="rounded-2xl p-4 flex items-center gap-3 bg-white shadow-card hover:bg-amber-50 active:scale-[0.98] transition-all"
          >
            <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <div className="text-left min-w-0">
              <p className="text-2xl font-bold leading-none text-slate-900">{drafts.length}</p>
              <p className="text-xs font-medium mt-1 text-slate-500">Drafts</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 ml-auto shrink-0" />
          </button>

        </div>

        {/* Upcoming services — only shown when nextServiceDate data exists */}
        {upcoming.length > 0 && (
          <div>
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
              Upcoming Services
            </h2>
            <div className="space-y-2">
              {upcoming.map((r) => {
                const { text, overdue } = serviceDueLabel(r.job.nextServiceDate!);
                return (
                  <button
                    key={r.id}
                    onClick={() => onOpenReport(r)}
                    className="w-full bg-white rounded-2xl px-4 py-3.5 flex items-center gap-3 shadow-card hover:bg-slate-50 active:bg-slate-100 transition-colors text-left"
                  >
                    <div className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                      overdue ? "bg-red-50" : "bg-blue-50"
                    )}>
                      <Calendar className={cn(
                        "w-5 h-5",
                        overdue ? "text-red-400" : "text-blue-400"
                      )} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {r.job.customerName}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {r.job.customServiceType ?? SERVICE_TYPE_LABELS[r.job.serviceType]}
                      </p>
                    </div>
                    <span className={cn(
                      "text-xs font-bold shrink-0",
                      overdue ? "text-red-500" : "text-blue-500"
                    )}>
                      {text}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent jobs */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Recent Jobs
            </h2>
            {sorted.length > 0 && (
              <button
                onClick={() => onReports("all")}
                className="text-xs font-semibold text-orange-500 hover:text-orange-600 transition-colors"
              >
                See all →
              </button>
            )}
          </div>

          {recent.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center shadow-card">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-7 h-7 text-slate-500" />
              </div>
              <p className="text-slate-800 text-sm font-semibold">No jobs yet</p>
              <p className="text-slate-500 text-sm mt-1 leading-relaxed">
                Tap New Report to write up your first AC or HVAC service.
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
