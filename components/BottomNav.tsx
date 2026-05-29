"use client";

import { type ComponentType } from "react";
import { LayoutDashboard, Plus, Users, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActiveSection } from "@/components/Sidebar";

interface BottomNavProps {
  activeSection: ActiveSection;
  onDashboard: () => void;
  onNewReport: () => void;
  onCustomers: () => void;
  onSettings: () => void;
}

function Tab({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex-1 flex flex-col items-center justify-end gap-1 pt-3"
    >
      <Icon className={cn(
        "w-5 h-5 transition-colors",
        active ? "text-orange-500" : "text-slate-400"
      )} />
      <span className={cn(
        "text-[10px] font-semibold leading-none transition-colors",
        active ? "text-orange-500" : "text-slate-400"
      )}>
        {label}
      </span>
    </button>
  );
}

export default function BottomNav({
  activeSection,
  onDashboard,
  onNewReport,
  onCustomers,
  onSettings,
}: BottomNavProps) {
  return (
    <nav
      aria-label="Main navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-100"
    >
      <div className="flex items-end sticky-footer px-1">

        <Tab
          icon={LayoutDashboard}
          label="Home"
          active={activeSection === "dashboard"}
          onClick={onDashboard}
        />

        {/* New Report — primary CTA, always orange */}
        <button
          onClick={onNewReport}
          aria-label="New Report"
          className="flex-1 flex flex-col items-center justify-end gap-1 pt-2"
        >
          <div className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center shadow-md shadow-orange-200/60 active:bg-orange-600 active:scale-95 transition-all">
            <Plus className="w-6 h-6 text-white" />
          </div>
          <span className="text-[10px] font-semibold leading-none text-orange-500">New</span>
        </button>

        <Tab
          icon={Users}
          label="Customers"
          active={activeSection === "customers"}
          onClick={onCustomers}
        />

        <Tab
          icon={Settings}
          label="Settings"
          active={activeSection === "settings"}
          onClick={onSettings}
        />

      </div>
    </nav>
  );
}
