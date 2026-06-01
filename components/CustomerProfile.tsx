"use client";

import { useState, useEffect } from "react";
import {
  ChevronLeft, Plus, MapPin, StickyNote,
  Phone, Mail, FileCheck2, FileClock, ChevronRight, Check, Trash2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Customer, ServiceReport } from "@/types/report";
import { SERVICE_TYPE_LABELS } from "@/types/report";
import { getReports, saveCustomer, deleteCustomer } from "@/lib/storage";
import { cn } from "@/lib/utils";

interface CustomerProfileProps {
  customer: Customer;
  onBack: () => void;
  onStartJob: (customer: Customer) => void;
  onOpenReport: (report: ServiceReport) => void;
  onCustomerUpdated: (customer: Customer) => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function CustomerProfile({
  customer,
  onBack,
  onStartJob,
  onOpenReport,
  onCustomerUpdated,
}: CustomerProfileProps) {
  const [reports, setReports] = useState<ServiceReport[]>([]);
  const [form, setForm] = useState({
    name: customer.name,
    address: customer.address,
    siteNotes: customer.siteNotes,
    phone: customer.phone ?? "",
    email: customer.email ?? "",
  });
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isDirty =
    form.name.trim() !== customer.name ||
    form.address.trim() !== customer.address ||
    form.siteNotes.trim() !== customer.siteNotes ||
    (form.phone.trim() || undefined) !== customer.phone ||
    (form.email.trim() || undefined) !== customer.email;

  useEffect(() => {
    const all = getReports();
    const matched = all
      .filter((r) => r.job.customerName.toLowerCase() === customer.name.toLowerCase())
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReports(matched);
  }, [customer.name]);

  function handleSave() {
    if (!form.name.trim()) return;
    const updated: Customer = {
      ...customer,
      name: form.name.trim(),
      address: form.address.trim(),
      siteNotes: form.siteNotes.trim(),
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };
    saveCustomer(updated);
    onCustomerUpdated(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  const displayName = form.name.trim() || customer.name;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col animate-screen-enter">
      <main className="flex-1 max-w-lg lg:max-w-4xl mx-auto w-full px-4 pt-10 lg:pt-8 pb-48 lg:pb-28 space-y-5">

        {/* Page title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0 hover:bg-slate-50 active:bg-slate-100 transition-colors"
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight truncate flex-1">{displayName}</h1>
          {saved ? (
            <span className="flex items-center gap-1 text-sm font-semibold text-green-500 shrink-0">
              <Check className="w-4 h-4" />
              Saved
            </span>
          ) : (
            <button
              onClick={handleSave}
              disabled={!isDirty || !form.name.trim()}
              className="text-sm font-semibold text-orange-500 disabled:text-slate-500 active:text-orange-700 transition-colors shrink-0"
            >
              Save
            </button>
          )}
        </div>

        {/* Editable fields */}
        <div className="bg-white rounded-2xl shadow-card px-4 py-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="flex items-center gap-1.5 text-slate-500">
              Name
            </Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Customer name"
              className="h-11 text-base bg-slate-50 border-slate-200"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="address" className="flex items-center gap-1.5 text-slate-500">
              <MapPin className="w-3.5 h-3.5" />Address
            </Label>
            <Input
              id="address"
              value={form.address}
              onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
              placeholder="Service address"
              className="h-11 text-base bg-slate-50 border-slate-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="flex items-center gap-1.5 text-slate-500">
                <Phone className="w-3.5 h-3.5" />Phone
              </Label>
              <Input
                id="phone"
                type="tel"
                inputMode="tel"
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="Phone number"
                className="h-11 text-base bg-slate-50 border-slate-200"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="flex items-center gap-1.5 text-slate-500">
                <Mail className="w-3.5 h-3.5" />Email
              </Label>
              <Input
                id="email"
                type="email"
                inputMode="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="Email address"
                className="h-11 text-base bg-slate-50 border-slate-200"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="siteNotes" className="flex items-center gap-1.5 text-slate-500">
              <StickyNote className="w-3.5 h-3.5" />Site Notes
            </Label>
            <Input
              id="siteNotes"
              value={form.siteNotes}
              onChange={(e) => setForm((p) => ({ ...p, siteNotes: e.target.value }))}
              placeholder="Gate code, parking, dogs, access instructions…"
              className="h-11 text-base bg-slate-50 border-slate-200"
            />
          </div>

          {/* Delete */}
          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-2 text-sm text-red-400 font-medium pt-1 active:text-red-600 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete customer
            </button>
          ) : (
            <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 space-y-3">
              <p className="text-sm font-semibold text-red-800">Delete {customer.name}?</p>
              <p className="text-xs text-red-600">Their service reports will remain. This can&apos;t be undone.</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 h-10 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-600 active:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => { deleteCustomer(customer.id); onBack(); }}
                  className="flex-1 h-10 rounded-xl bg-red-500 text-sm font-semibold text-white active:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Service history */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Service History</h2>
            {reports.length > 0 && (
              <span className="bg-slate-900 text-white text-[11px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                {reports.length}
              </span>
            )}
          </div>

          {reports.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center shadow-card">
              <p className="text-slate-600 text-sm font-semibold">No service history yet</p>
              <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                Reports will appear here after jobs are completed.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {reports.map((report) => (
                <button
                  key={report.id}
                  onClick={() => onOpenReport(report)}
                  className="w-full text-left bg-white rounded-2xl shadow-card hover:shadow-card-hover active:scale-[0.99] transition-all overflow-hidden"
                >
                  <div className="flex items-center gap-3 p-4">
                    <div className={cn(
                      "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0",
                      report.status === "complete" ? "bg-green-50" : "bg-amber-50"
                    )}>
                      {report.status === "complete"
                        ? <FileCheck2 className="w-5 h-5 text-green-500" />
                        : <FileClock className="w-5 h-5 text-amber-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 text-sm truncate">
                        {SERVICE_TYPE_LABELS[report.job.serviceType]}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{formatDate(report.job.jobDate)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={cn(
                        "text-[11px] font-semibold px-2 py-0.5 rounded-full",
                        report.status === "complete"
                          ? "bg-green-100 text-green-700"
                          : "bg-amber-100 text-amber-700"
                      )}>
                        {report.status === "complete" ? "Complete" : "Draft"}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Start new job */}
      <div className="fixed left-0 right-0 z-20 bg-white border-t border-slate-100 above-nav">
        <div className="lg:pl-60">
        <div className="max-w-lg lg:max-w-4xl mx-auto px-4 pt-3 sticky-footer">
          <button
            onClick={() => onStartJob(customer)}
            className="w-full h-14 rounded-2xl bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold text-base flex items-center justify-center gap-2 transition-colors shadow-md shadow-orange-200/50"
          >
            <Plus className="w-5 h-5" />
            Start New Job
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}
