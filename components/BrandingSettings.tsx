"use client";

import { useRef, useState } from "react";
import { CheckCircle2, Upload, X, Palette, LogOut, Eye, EyeOff, Loader2, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BusinessProfile } from "@/types/report";
import { saveBusinessProfile } from "@/lib/storage";
import { useAuth } from "@/components/auth/AuthProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- onBack reserved for future back-button support
export default function BrandingSettings({ profile, onBack, onSave }: BrandingSettingsProps) {
  const [form, setForm] = useState<BusinessProfile>(profile);
  const [saved, setSaved] = useState(false);
  const [logoLoading, setLogoLoading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const { isConfigured, signOut, user } = useAuth();
  const isDemo = user?.email === "demo@jobwrap.app";
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  function handleClearAllData() {
    localStorage.clear();
    window.location.reload();
  }

  // ── Account: Change Password ─────────────────────────────────────────────
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [pwState, setPwState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [pwError, setPwError] = useState<string | null>(null);

  async function handleChangePassword() {
    setPwError(null);
    if (pwNew.length < 8) { setPwError("New password must be at least 8 characters."); return; }
    if (pwNew !== pwConfirm) { setPwError("Passwords do not match."); return; }
    setPwState("saving");
    const client = getSupabaseBrowserClient();
    if (!client) { setPwState("error"); setPwError("Not connected."); return; }
    const { error } = await client.auth.updateUser({ password: pwNew });
    if (error) { setPwState("error"); setPwError(error.message); return; }
    setPwState("saved");
    setPwCurrent(""); setPwNew(""); setPwConfirm("");
    setTimeout(() => setPwState("idle"), 3000);
  }

  // ── Account: Change Email ────────────────────────────────────────────────
  const [newEmail, setNewEmail] = useState("");
  const [emailState, setEmailState] = useState<"idle" | "saving" | "sent" | "error">("idle");
  const [emailError, setEmailError] = useState<string | null>(null);

  async function handleChangeEmail() {
    setEmailError(null);
    if (!newEmail.includes("@")) { setEmailError("Enter a valid email address."); return; }
    setEmailState("saving");
    const client = getSupabaseBrowserClient();
    if (!client) { setEmailState("error"); setEmailError("Not connected."); return; }
    const { error } = await client.auth.updateUser({ email: newEmail });
    if (error) { setEmailState("error"); setEmailError(error.message); return; }
    setEmailState("sent");
    setNewEmail("");
    setTimeout(() => setEmailState("idle"), 5000);
  }

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
      <main className="flex-1 max-w-lg lg:max-w-4xl mx-auto w-full px-4 pt-10 lg:pt-8 pb-52 lg:pb-32 space-y-5">

        {/* Page title */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Settings</h1>
          {saved && (
            <span className="text-sm text-green-600 flex items-center gap-1.5 font-semibold">
              <CheckCircle2 className="w-4 h-4" /> Saved
            </span>
          )}
        </div>

        {/* ── Account ─────────────────────────────────────────────────────── */}
        {isConfigured && (
          <>
            <div className="flex items-center gap-3 pt-2">
              <h2 className="text-xl font-bold text-slate-900 shrink-0">Account</h2>
              <div className="flex-1 h-px bg-slate-300" />
            </div>

            {/* Change Password */}
            <Card className="border border-slate-100 shadow-card">
              <CardHeader className="pb-2 px-4 pt-4">
                <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-widest">Change Password</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="pw-new">New password</Label>
                  <div className="relative">
                    <Input
                      id="pw-new"
                      type={showPw ? "text" : "password"}
                      value={pwNew}
                      onChange={(e) => setPwNew(e.target.value)}
                      placeholder="Min. 8 characters"
                      autoComplete="new-password"
                      className="h-11 text-base pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                      tabIndex={-1}
                    >
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pw-confirm">Confirm new password</Label>
                  <Input
                    id="pw-confirm"
                    type={showPw ? "text" : "password"}
                    value={pwConfirm}
                    onChange={(e) => setPwConfirm(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="h-11 text-base"
                  />
                </div>
                {pwError && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{pwError}</p>
                )}
                {pwState === "saved" && (
                  <p className="text-sm text-green-600 bg-green-50 border border-green-100 rounded-xl px-3 py-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" /> Password updated successfully.
                  </p>
                )}
                <button
                  onClick={handleChangePassword}
                  disabled={pwState === "saving" || !pwNew || !pwConfirm}
                  className="w-full h-11 rounded-xl bg-slate-900 text-white text-sm font-semibold flex items-center justify-center gap-2 active:bg-slate-700 transition-colors disabled:opacity-40"
                >
                  {pwState === "saving" ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating…</> : "Update Password"}
                </button>
              </CardContent>
            </Card>

            {/* Change Email */}
            <Card className="border border-slate-100 shadow-card">
              <CardHeader className="pb-2 px-4 pt-4">
                <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-widest">Change Email</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="new-email">New email address</Label>
                  <Input
                    id="new-email"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="new@example.com"
                    autoComplete="email"
                    className="h-11 text-base"
                  />
                </div>
                {emailError && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{emailError}</p>
                )}
                {emailState === "sent" && (
                  <p className="text-sm text-green-600 bg-green-50 border border-green-100 rounded-xl px-3 py-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" /> Confirmation sent — check your new inbox to confirm.
                  </p>
                )}
                <button
                  onClick={handleChangeEmail}
                  disabled={emailState === "saving" || !newEmail}
                  className="w-full h-11 rounded-xl bg-slate-900 text-white text-sm font-semibold flex items-center justify-center gap-2 active:bg-slate-700 transition-colors disabled:opacity-40"
                >
                  {emailState === "saving" ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</> : "Update Email"}
                </button>
              </CardContent>
            </Card>
          </>
        )}

        {/* ── Business ─────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 pt-2">
          <h2 className="text-xl font-bold text-slate-900 shrink-0">Business</h2>
          <div className="flex-1 h-px bg-slate-300" />
        </div>

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
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-widest">Business Details</CardTitle>
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
            <div className="space-y-2">
              <Label>Licences / Registrations</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input value={form.licence1Label} onChange={(e) => update("licence1Label", e.target.value)} placeholder="e.g. ARCtick, Gas Safe, EPA 608" className="h-11 text-base" />
                <Input value={form.licence1Number} onChange={(e) => update("licence1Number", e.target.value)} placeholder="Number" className="h-11 text-base" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input value={form.licence2Label} onChange={(e) => update("licence2Label", e.target.value)} placeholder="Label (e.g. Gas Licence)" className="h-11 text-base" />
                <Input value={form.licence2Number} onChange={(e) => update("licence2Number", e.target.value)} placeholder="Number" className="h-11 text-base" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tagline">Tagline <span className="text-slate-500 font-normal">(optional)</span></Label>
              <Input id="tagline" value={form.tagline ?? ""} onChange={(e) => update("tagline", e.target.value)} placeholder="e.g. Licensed & Insured · Your local specialists" className="h-12 text-base" />
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card className="border border-slate-100 shadow-card">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-widest">Contact Info</CardTitle>
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
              <Label htmlFor="website">Website <span className="text-slate-500 font-normal">(optional)</span></Label>
              <Input id="website" type="url" value={form.website ?? ""} onChange={(e) => update("website", e.target.value)} placeholder="e.g. www.apexclimate.com" className="h-12 text-base" />
            </div>
          </CardContent>
        </Card>

        {/* Logo upload */}
        <Card className="border border-slate-100 shadow-card">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-widest">Business Logo</CardTitle>
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
                  <p className="text-xs text-slate-500 mt-0.5">Shown in report headers and PDFs</p>
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
                className="w-full h-24 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-500 hover:border-slate-300 hover:text-slate-500 active:bg-slate-50 transition-colors disabled:opacity-50"
              >
                <Upload className="w-5 h-5" />
                <span className="text-sm font-medium">
                  {logoLoading ? "Processing…" : "Tap to upload logo"}
                </span>
                <span className="text-xs">Square logo · PNG or JPG · White or transparent background works best</span>
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
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-widest">Header Colour</CardTitle>
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
                  <Palette className="w-4 h-4 text-slate-500" />
                )}
                <input
                  type="color"
                  value={form.brandColor || "#0f172a"}
                  onChange={(e) => update("brandColor", e.target.value)}
                  className="absolute opacity-0 w-0 h-0"
                />
              </label>
            </div>
            <p className="text-xs text-slate-500">
              Tap a swatch or pick a custom colour. Shown in report headers and PDFs.
            </p>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-500">Settings saved on this device</p>

        {/* Sign out */}
        {isConfigured && (
          <div className="pt-2 space-y-3 pb-4">
            <button
              onClick={async () => { await signOut(); window.location.href = "/login"; }}
              className="w-full flex items-center justify-center gap-2 h-12 rounded-xl text-sm font-medium text-slate-500 border border-slate-200 hover:bg-slate-50 hover:text-slate-600 active:bg-slate-100 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
            {!isDemo && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="w-full flex items-center justify-center gap-2 h-12 rounded-xl text-sm font-medium text-red-400 border border-red-100 hover:bg-red-50 active:bg-red-100 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Clear all data
              </button>
            )}
          </div>
        )}

        {/* Clear data confirmation */}
        {showClearConfirm && (
          <div
            className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50"
            onClick={() => setShowClearConfirm(false)}
          >
            <div
              className="bg-white rounded-t-3xl px-4 pt-3 pb-above-nav w-full max-w-lg mx-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-5" />
              <p className="text-base font-bold text-slate-900 text-center">Clear all data?</p>
              <p className="text-sm text-slate-500 text-center mt-1 mb-6">
                All reports, customers, photos and settings will be permanently deleted from this device.
              </p>
              <div className="space-y-3">
                <button
                  onClick={handleClearAllData}
                  className="w-full h-14 rounded-2xl bg-red-500 text-base font-bold text-white active:bg-red-600 transition-colors"
                >
                  Clear everything
                </button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="w-full h-14 rounded-2xl bg-slate-100 text-base font-semibold text-slate-700 active:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Sticky Save button */}
      <div className="fixed left-0 right-0 z-20 bg-white border-t border-slate-100 above-nav">
        <div className="max-w-lg lg:max-w-4xl mx-auto px-4 pt-3 sticky-footer">
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
