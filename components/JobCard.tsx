"use client";

import { useState, useEffect } from "react";
import { Trash2, ChevronRight, FileCheck2, FileClock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ServiceReport } from "@/types/report";
import { SERVICE_TYPE_LABELS } from "@/types/report";
import { cn } from "@/lib/utils";

export function formatJobDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function JobCard({
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
  const [armed, setArmed] = useState(false);

  // Auto-disarm after 3 seconds if not confirmed
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(t);
  }, [armed]);

  function handleDeleteClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (!armed) {
      setArmed(true);
    } else {
      onDelete(e, report.id);
    }
  }

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
            {formatJobDate(report.job.jobDate)}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {showStatus && !armed && (
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
          {armed ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={(e) => { e.stopPropagation(); setArmed(false); }}
                className="h-7 px-2.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 active:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteClick}
                className="h-7 px-2.5 rounded-lg text-xs font-semibold bg-red-500 text-white active:bg-red-600 transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                Trash
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={handleDeleteClick}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 active:bg-red-100 transition-colors"
                aria-label="Delete report"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
