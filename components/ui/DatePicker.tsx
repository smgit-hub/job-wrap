"use client";

import { CalendarDays } from "lucide-react";

interface DatePickerProps {
  id?: string;
  value: string;          // YYYY-MM-DD
  onChange: (iso: string) => void;
  placeholder?: string;
  className?: string;
}

function formatDisplay(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export default function DatePicker({ id, value, onChange, placeholder = "Select date", className = "" }: DatePickerProps) {
  return (
    <div className={`relative h-11 ${className}`}>
      {/* Visible styled display */}
      <div className="h-11 flex items-center justify-between px-3 rounded-xl border border-slate-200 bg-slate-50 pointer-events-none">
        {value
          ? <span className="text-base text-slate-900">{formatDisplay(value)}</span>
          : <span className="text-base text-slate-500">{placeholder}</span>
        }
        <CalendarDays className="w-4 h-4 text-slate-500 shrink-0 ml-2" />
      </div>
      {/* Invisible native date input — covers the display div so tapping opens the picker */}
      <input
        id={id}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
    </div>
  );
}
