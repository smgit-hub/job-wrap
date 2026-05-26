"use client";

import { useRef, useState } from "react";
import { ChevronLeft, CheckCircle2, Upload, X, Palette } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BusinessProfile } from "@/types/report";
import { saveBusinessProfile } from "@/lib/storage";
import { cn } from "@/lib/utils";

interface BrandingSettingsProps {
  profile: BusinessProfile;
  onBack: () => void;
  onSave: (profile: BusinessProfile) => void;
}

const COLOR_PRESETS = [
  { value: "#0f172a", label: "Slate" },
  { value: "#1e40af", label: "Navy" },
  { value: "#0369a1", label: "Sky" },
  { value: "#059669", label: "Green" },
  { value: "#7c3aed", label: "Purple" },
  { value: "#dc2626", label: "Red" },
];

async function compressLogo(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      // max 300px on longest side
      const MAX = 300;
      const scale = Math.min(1, MAX / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas unavailable")); return; }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/png", 0.9));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Image load failed")); };
    img.src = url;
  });
}

export default function BrandingSettings({ profile, onBack, onSave }: BrandingSettingsProps) {
  const [form, setForm] = useState<BusinessProfile>(profile);
  const [saved, setSaved] = useState(false);
  const [logoLoading, setLogoLoading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  function update(field: keyof BusinessProfile, value: string) {
    setSaved(false);
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoLoading(true);
    try {
      const dataUrl = await compressLogo(file);
      setForm((prev) => ({ ...prev, logoUrl: dataUrl }));
      setSaved(false);
    } catch {
      // silently fail — user can try again
    } finally {
      setLogoLoading(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  }

  function removeLogo() {
    setForm((prev) => ({ ...prev, logoUrl: undefined }));
    setSaved(false);
  }

  function handleSave() {
    saveBusinessProfile(form);
    onSave(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const headerColor = form.brandColor || "#0f172a";

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
          <span className="flex-1 font-bold text-slate-900 ml-3">Business Settings</span>
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
          style={{ backgroundColor: headerColor }}
        >
          <div className="flex items-center gap-3">
            {form.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.logoUrl}
                alt="Logo"
                className="w-10 h-10 rounded-xl object-contain bg-white/10"
              />
            )}
            <div>
              <p className="font-extrabold text-lg leading-tight tracking-tight">
                {form.businessName || "Your Business Name"}
              </p>
              <p className="text-white/75 text-sm mt-0.5 font-medium">
                {form.technicianName || "Technician Name"}
              </p>
            </div>
          </div>
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

        {/* Logo upload */}
        <Card className="border border-slate-100 shadow-card">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest">Business Logo</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {form.logoUrl ? (
              <div className="flex items-center gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={form.logoUrl}
                  alt="Logo preview"
                  className="w-16 h-16 rounded-xl object-contain border border-slate-100 bg-slate-50"
                />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800">Logo uploaded</p>
                  <p className="text-xs text-slate-400 mt-0.5">Shown in report headers and PDFs</p>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => logoInputRef.current?.click()}
                      className="h-8 px-3 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 active:bg-slate-200 transition-colors"
                    >
                      Replace
                    </button>
                    <button
                      onClick={removeLogo}
                      className="h-8 px-3 rounded-lg text-xs font-semibold bg-red-50 text-red-500 active:bg-red-100 transition-colors flex items-center gap-1"
                    >
                      <X className="w-3 h-3" /> Remove
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => logoInputRef.current?.click()}
                disabled={logoLoading}
                className="w-full h-24 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-slate-300 hover:text-slate-500 active:bg-slate-50 transition-colors disabled:opacity-50"
              >
                <Upload className="w-5 h-5" />
                <span className="text-sm font-medium">
                  {logoLoading ? "Processing…" : "Tap to upload logo"}
                </span>
                <span className="text-xs">PNG or JPG recommended</span>
              </button>
            )}
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoFile}
            />
          </CardContent>
        </Card>

        {/* Brand colour */}
        <Card className="border border-slate-100 shadow-card">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest">Header Colour</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-4">
            {/* Preset swatches */}
            <div className="flex gap-2.5 flex-wrap">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => update("brandColor", preset.value)}
                  title={preset.label}
                  aria-label={`Set header colour to ${preset.label}`}
                  aria-pressed={(form.brandColor || "#0f172a") === preset.value}
                  className={cn(
                    "w-9 h-9 rounded-xl transition-all border-2",
                    (form.brandColor || "#0f172a") === preset.value
                      ? "border-orange-400 scale-110 shadow-md"
                      : "border-transparent"
                  )}
                  style={{ backgroundColor: preset.value }}
                />
              ))}

              {/* Custom colour picker */}
              <label
                title="Custom colour"
                aria-label="Pick a custom header colour"
                className={cn(
                  "w-9 h-9 rounded-xl border-2 flex items-center justify-center cursor-pointer transition-all overflow-hidden",
                  !COLOR_PRESETS.some((p) => p.value === (form.brandColor || "#0f172a"))
                    ? "border-orange-400 scale-110 shadow-md"
                    : "border-transparent border-slate-200"
                )}
                style={{
                  backgroundColor: !COLOR_PRESETS.some((p) => p.value === (form.brandColor || "#0f172a"))
                    ? form.brandColor || "#0f172a"
                    : undefined,
                }}
              >
                {COLOR_PRESETS.some((p) => p.value === (form.brandColor || "#0f172a")) && (
                  <Palette className="w-4 h-4 text-slate-400" />
                )}
                <input
                  type="color"
                  value={form.brandColor || "#0f172a"}
                  onChange={(e) => update("brandColor", e.target.value)}
                  className="absolute opacity-0 w-0 h-0"
                />
              </label>
            </div>
            <p className="text-xs text-slate-400">
              Tap a swatch or pick a custom colour. Shown in report headers and PDFs.
            </p>
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
