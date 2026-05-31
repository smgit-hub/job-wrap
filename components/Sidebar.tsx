"use client";

import { LayoutDashboard, FileText, Users, Settings, LogOut } from "lucide-react";
import { getBusinessProfile } from "@/lib/storage";
import { useAuth } from "@/components/auth/AuthProvider";
import { cn } from "@/lib/utils";

export type ActiveSection = "dashboard" | "reports" | "customers" | "settings";

interface SidebarProps {
  activeSection: ActiveSection;
  onDashboard: () => void;
  onReports: () => void;
  onCustomers: () => void;
  onSettings: () => void;
}

const NAV_ITEMS = [
  { id: "dashboard" as ActiveSection, label: "Dashboard", icon: LayoutDashboard },
  { id: "reports"   as ActiveSection, label: "Reports",   icon: FileText },
  { id: "customers" as ActiveSection, label: "Customers", icon: Users },
  { id: "settings"  as ActiveSection, label: "Settings",  icon: Settings },
] as const;

export default function Sidebar({ activeSection, onDashboard, onReports, onCustomers, onSettings }: SidebarProps) {
  const profile = getBusinessProfile();
  const { isConfigured, signOut } = useAuth();

  const handlers: Record<ActiveSection, () => void> = {
    dashboard: onDashboard,
    reports:   onReports,
    customers: onCustomers,
    settings:  onSettings,
  };

  return (
    <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-60 bg-white border-r border-slate-100 z-30">

      {/* Brand mark */}
      <div className="px-4 pt-5 pb-4 border-b border-slate-100">
        <button
          onClick={onDashboard}
          className="flex items-center gap-2.5 w-full text-left rounded-xl px-1 py-1 -mx-1 hover:bg-slate-50 active:bg-slate-100 transition-colors"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/icon-192.png?v=2"
            alt="JobWrap"
            className="w-10 h-10 shrink-0 object-cover"
          />
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 leading-tight">JobWrap</p>
            {profile.businessName && (
              <p className="text-xs text-slate-400 leading-tight truncate">{profile.businessName}</p>
            )}
          </div>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">

        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={handlers[id]}
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-colors",
              activeSection === id
                ? "bg-slate-100 text-slate-900 font-semibold"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700 font-medium"
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </button>
        ))}
      </nav>

      {/* Sign out */}
      {isConfigured && (
        <div className="px-3 pb-5 border-t border-slate-100 pt-3">
          <button
            onClick={async () => { await signOut(); window.location.href = "/login"; }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Sign out
          </button>
        </div>
      )}
    </aside>
  );
}
