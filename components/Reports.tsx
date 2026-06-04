"use client";

import { useEffect, useState, useMemo } from "react";
import { FileText, Trash2, RotateCcw, Search, X, RefreshCw } from "lucide-react";
import type { ServiceReport } from "@/types/report";
import { getReports, getDeletedReports, deleteReport, restoreReport, purgeReport } from "@/lib/storage";
import { syncFromSupabase } from "@/lib/db";
import { JobCard, formatJobDate } from "@/components/JobCard";
import { SERVICE_TYPE_LABELS } from "@/types/report";
import { cn } from "@/lib/utils";

export type ReportsFilter = "all" | "complete" | "draft" | "deleted";

interface ReportsProps {
  initialFilter?: ReportsFilter;
  onOpenReport: (report: ServiceReport) => void;
}

const FILTERS: { id: ReportsFilter; label: string }[] = [
  { id: "all",      label: "All" },
  { id: "complete", label: "Completed" },
  { id: "draft",    label: "Drafts" },
  { id: "deleted",  label: "Deleted" },
];

function daysRemaining(deletedAt: string): number {
  const ms = 7 * 24 * 60 * 60 * 1000 - (Date.now() - new Date(deletedAt).getTime());
  return Math.max(1, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

function DeletedCard({
  report,
  onRestore,
  onPurge,
}: {
  report: ServiceReport;
  onRestore: (id: string) => void;
  onPurge: (id: string) => void;
}) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(t);
  }, [armed]);

  const days = daysRemaining(report.deletedAt!);

  return (
    <div className="bg-white rounded-2xl shadow-card overflow-hidden border border-slate-100 opacity-75">
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0">
          <Trash2 className="w-5 h-5 text-slate-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-600 truncate leading-snug">
            {report.job.customerName || "Unknown customer"}
          </p>
          <p className="text-xs text-slate-500 truncate mt-0.5">
            {SERVICE_TYPE_LABELS[report.job.serviceType]}
            {report.job.serviceAddress ? ` · ${report.job.serviceAddress}` : ""}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {formatJobDate(report.job.jobDate)} · {days} day{days !== 1 ? "s" : ""} until permanent deletion
          </p>
        </div>
      </div>
      <div className="flex gap-2 px-4 pb-4">
        <button
          onClick={() => onRestore(report.id)}
          className="flex-1 h-10 rounded-xl bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Restore
        </button>
        <button
          onClick={() => armed ? onPurge(report.id) : setArmed(true)}
          className={cn(
            "h-10 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors",
            armed
              ? "px-3 bg-red-500 text-white active:bg-red-600"
              : "w-10 text-slate-500 hover:text-red-400 hover:bg-red-50 active:bg-red-100"
          )}
          aria-label={armed ? "Confirm permanent delete" : "Permanently delete"}
        >
          <Trash2 className="w-3.5 h-3.5 shrink-0" />
          {armed && <span>Delete forever?</span>}
        </button>
      </div>
    </div>
  );
}

export default function Reports({ initialFilter = "all", onOpenReport }: ReportsProps) {
  const [reports, setReports] = useState<ServiceReport[]>([]);
  const [deleted, setDeleted] = useState<ServiceReport[]>([]);
  const [filter, setFilter] = useState<ReportsFilter>(initialFilter);
  const [search, setSearch] = useState("");
  const [syncing, setSyncing] = useState(false);

  async function handleRefresh() {
    setSyncing(true);
    await syncFromSupabase();
    reload();
    setSyncing(false);
  }

  function reload() {
    setReports(getReports());
    setDeleted(getDeletedReports().sort(
      (a, b) => new Date(b.deletedAt!).getTime() - new Date(a.deletedAt!).getTime()
    ));
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reload();
  }, []);

  // Keep filter in sync if the parent navigates with a different initialFilter
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFilter(initialFilter);
  }, [initialFilter]);

  const sorted = useMemo(
    () => [...reports].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    ),
    [reports]
  );

  const complete = useMemo(() => sorted.filter((r) => r.status === "complete"), [sorted]);
  const drafts   = useMemo(() => sorted.filter((r) => r.status === "draft"), [sorted]);

  const counts: Record<ReportsFilter, number> = useMemo(() => ({
    all:      sorted.length,
    complete: complete.length,
    draft:    drafts.length,
    deleted:  deleted.length,
  }), [sorted, complete, drafts, deleted]);

  const baseVisible = useMemo(
    () => filter === "complete" ? complete : filter === "draft" ? drafts : sorted,
    [filter, complete, drafts, sorted]
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return baseVisible;
    return baseVisible.filter((r) => {
      const jn = ("JW-" + r.id.replace(/[^a-zA-Z0-9]/g, "").slice(-6)).toUpperCase();
      return (
        r.job.customerName.toLowerCase().includes(q) ||
        jn.toLowerCase().includes(q)
      );
    });
  }, [baseVisible, search]);

  function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    deleteReport(id);
    reload();
  }

  function handleRestore(id: string) {
    restoreReport(id);
    reload();
  }

  function handlePurge(id: string) {
    purgeReport(id);
    reload();
  }

  return (
    <div className="min-h-screen bg-slate-100 animate-screen-enter">
      <main className="max-w-lg lg:max-w-4xl mx-auto px-4 pt-10 lg:pt-8 pb-28 lg:pb-8 space-y-5">

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Reports</h1>
          <button
            onClick={handleRefresh}
            disabled={syncing}
            aria-label="Refresh"
            className="w-9 h-9 rounded-xl bg-white shadow-card flex items-center justify-center text-slate-500 hover:text-slate-700 active:bg-slate-50 transition-colors disabled:opacity-40"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name or job number…"
            className="w-full h-11 pl-10 pr-10 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-300 shadow-card"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setFilter(id)}
              className={cn(
                "flex items-center gap-1.5 px-4 h-9 rounded-xl text-sm font-semibold transition-colors",
                filter === id
                  ? id === "deleted" ? "bg-red-500 text-white" : "bg-slate-900 text-white"
                  : "bg-white text-slate-500 shadow-card hover:bg-slate-50"
              )}
            >
              {label}
              {counts[id] > 0 && (
                <span className={cn(
                  "text-[11px] font-bold leading-none px-1.5 py-0.5 rounded-full",
                  filter === id ? "bg-white/20 text-white" : id === "deleted" ? "bg-red-100 text-red-500" : "bg-slate-100 text-slate-500"
                )}>
                  {counts[id]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Deleted view */}
        {filter === "deleted" ? (
          deleted.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center shadow-card">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-7 h-7 text-slate-500" />
              </div>
              <p className="text-slate-800 text-sm font-semibold">Trash is empty</p>
              <p className="text-slate-500 text-sm mt-1">Deleted reports appear here for 7 days before being permanently removed.</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-slate-500">Deleted reports are permanently removed after 7 days.</p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 lg:gap-3">
                {deleted.map((report) => (
                  <DeletedCard
                    key={report.id}
                    report={report}
                    onRestore={handleRestore}
                    onPurge={handlePurge}
                  />
                ))}
              </div>
            </>
          )
        ) : (
          /* Normal report list */
          visible.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center shadow-card">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                {search ? <Search className="w-7 h-7 text-slate-500" /> : <FileText className="w-7 h-7 text-slate-500" />}
              </div>
              <p className="text-slate-800 text-sm font-semibold">
                {search ? "No results found" : filter === "complete" ? "No completed jobs yet" : filter === "draft" ? "No drafts" : "No reports yet"}
              </p>
              <p className="text-slate-500 text-sm mt-1 leading-relaxed">
                {search
                  ? `No reports matching "${search}".`
                  : filter === "complete"
                    ? "Finished jobs will appear here."
                    : filter === "draft"
                      ? "Jobs saved as draft will appear here."
                      : "Tap New Report to write up your first job."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 lg:gap-3">
              {visible.map((report) => (
                <JobCard
                  key={report.id}
                  report={report}
                  onOpen={onOpenReport}
                  onDelete={handleDelete}
                  showStatus={filter === "all"}
                />
              ))}
            </div>
          )
        )}

      </main>
    </div>
  );
}
