"use client";

import { useState } from "react";
import { ChevronLeft, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BusinessProfile } from "@/types/report";
import { saveBusinessProfile } from "@/lib/storage";

interface BrandingSettingsProps {
  profile: BusinessProfile;
  onBack: () => void;
  onSave: (profile: BusinessProfile) => void;
}

export default function BrandingSettings({ profile, onBack, onSave }: BrandingSettingsProps) {
  const [form, setForm] = useState<BusinessProfile>(profile);
  const [saved, setSaved] = useState(false);

  function update(field: keyof BusinessProfile, value: string) {
    setSaved(false);
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSave() {
    saveBusinessProfile(form);
    onSave(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col animate-screen-enter">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10 shrink-0">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 active:bg-slate-200 transition-colors"
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <span className="flex-1 text-center font-bold text-slate-900">Business Settings</span>
          <div className="w-9 h-9 flex items-center justify-center shrink-0">
            {saved && (
              <span className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Saved
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 pb-32 space-y-5">
        {/* Live preview */}
        <div
          className="rounded-2xl p-5 text-white transition-all shadow-md"
          style={{ backgroundColor: "#0f172a" }}
        >
          <p className="font-extrabold text-lg leading-tight tracking-tight">
            {form.businessName || "Your Business Name"}
          </p>
          <p className="text-white/75 text-sm mt-0.5 font-medium">
            {form.technicianName || "Technician Name"}
          </p>
        </div>

        {/* Business details */}
        <Card className="border border-slate-100 shadow-card">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest">Business Details</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="businessName">Business Name</Label>
              <Input id="businessName" value={form.businessName} onChange={(e) => update("businessName", e.target.value)} placeholder="e.g. Apex Climate Services" className="h-12 text-base" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="technicianName">Technician Name</Label>
              <Input id="technicianName" value={form.technicianName} onChange={(e) => update("technicianName", e.target.value)} placeholder="e.g. Alex Morgan" className="h-12 text-base" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="licenseNumber">Registration / Licence</Label>
              <Input id="licenseNumber" value={form.licenseNumber} onChange={(e) => update("licenseNumber", e.target.value)} placeholder="e.g. REG-2024-0147" className="h-12 text-base" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tagline">Tagline <span className="text-slate-400 font-normal">(optional)</span></Label>
              <Input id="tagline" value={form.tagline ?? ""} onChange={(e) => update("tagline", e.target.value)} placeholder="e.g. Licensed & Insured · Your local specialists" className="h-12 text-base" />
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card className="border border-slate-100 shadow-card">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest">Contact Info</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="e.g. +1 555 012 3456" className="h-12 text-base" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="e.g. hello@apexclimate.com" className="h-12 text-base" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="website">Website <span className="text-slate-400 font-normal">(optional)</span></Label>
              <Input id="website" type="url" value={form.website ?? ""} onChange={(e) => update("website", e.target.value)} placeholder="e.g. www.apexclimate.com" className="h-12 text-base" />
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-400">Settings saved on this device</p>
      </main>

      {/* Sticky Save button */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-slate-100">
        <div className="max-w-lg mx-auto px-4 pt-3 sticky-footer">
          <button
            onClick={handleSave}
            className="w-full h-14 rounded-2xl text-base font-bold bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white flex items-center justify-center gap-2 transition-colors shadow-md shadow-orange-200/50"
          >
            {saved ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Saved
              </>
            ) : (
              "Save Settings"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
