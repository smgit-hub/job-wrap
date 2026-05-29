"use client";

import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import type { ServiceReport } from "@/types/report";
import { getReports, deleteReport } from "@/lib/storage";
import { JobCard } from "@/components/JobCard";
import { cn } from "@/lib/utils";

export type ReportsFilter = "all" | "complete" | "draft";

interface ReportsProps {
  initialFilter?: ReportsFilter;
  onOpenReport: (report: ServiceReport) => void;
}

const FILTERS: { id: ReportsFilter; label: string }[] = [
  { id: "all",      label: "All" },
  { id: "complete", label: "Completed" },
  { id: "draft",    label: "Drafts" },
];

export default function Reports({ initialFilter = "all", onOpenReport }: ReportsProps) {
  const [reports, setReports] = useState<ServiceReport[]>([]);
  const [filter, setFilter] = useState<ReportsFilter>(initialFilter);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReports(getReports());
  }, []);

  // Keep filter in sync if the parent navigates with a different initialFilter
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFilter(initialFilter);
  }, [initialFilter]);

  const sorted = [...reports].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  const complete = sorted.filter((r) => r.status === "complete");
  const drafts   = sorted.filter((r) => r.status === "draft");

  const counts: Record<ReportsFilter, number> = {
    all:      sorted.length,
    complete: complete.length,
    draft:    drafts.length,
  };

  const visible = filter === "all" ? sorted : filter === "complete" ? complete : drafts;

  function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    deleteReport(id);
    setReports((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div className="min-h-screen bg-slate-100 animate-screen-enter">
      <main className="max-w-lg lg:max-w-4xl mx-auto px-4 pt-10 lg:pt-8 pb-28 lg:pb-8 space-y-5">

        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Reports</h1>

        {/* Filter tabs */}
        <div className="flex gap-2">
          {FILTERS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setFilter(id)}
              className={cn(
                "flex items-center gap-1.5 px-4 h-9 rounded-xl text-sm font-semibold transition-colors",
                filter === id
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-500 shadow-card hover:bg-slate-50"
              )}
            >
              {label}
              <span className={cn(
                "text-[11px] font-bold leading-none px-1.5 py-0.5 rounded-full",
                filter === id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400"
              )}>
                {counts[id]}
              </span>
            </button>
          ))}
        </div>

        {/* Report list */}
        {visible.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center shadow-card">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-7 h-7 text-slate-300" />
            </div>
            <p className="text-slate-800 text-sm font-semibold">
              {filter === "complete" ? "No completed jobs yet" : filter === "draft" ? "No drafts" : "No reports yet"}
            </p>
            <p className="text-slate-400 text-sm mt-1 leading-relaxed">
              {filter === "complete"
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
        )}

      </main>
    </div>
  );
}
