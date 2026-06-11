"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function PdfPageViewer() {
  const [page, setPage] = useState<1 | 2>(1);

  return (
    <div className="flex-1 flex flex-col gap-3">
      {/* Page display — max height keeps it proportional regardless of container width */}
      <div className="rounded-xl overflow-hidden shadow-xl shadow-slate-300/50 ring-1 ring-slate-200 bg-white" style={{maxHeight: '520px'}}>
        <Image
          src={page === 1 ? "/screenshots/report-page1.png" : "/screenshots/report-page2.png"}
          alt={`Service report page ${page}`}
          width={2480}
          height={3508}
          className="w-full h-auto"
        />
      </div>

      {/* Bottom navigation */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => setPage(1)}
          disabled={page === 1}
          className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4 text-slate-700" />
        </button>
        <span className="text-xs text-slate-400 font-medium">Page {page} of 2</span>
        <button
          onClick={() => setPage(2)}
          disabled={page === 2}
          className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4 text-slate-700" />
        </button>
      </div>
    </div>
  );
}
