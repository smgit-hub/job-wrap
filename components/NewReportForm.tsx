"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ChevronLeft, ChevronDown, ChevronUp,
  Sparkles, Loader2, AlertCircle, BookmarkCheck, ArrowRight,
  MapPin, Phone, Mail, StickyNote, Wrench,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import FreeformRecordingFlow from "@/components/recording/FreeformRecordingFlow";
import type { JobDetails, VoiceNotes, ServiceType, Customer, ServiceReport } from "@/types/report";
import { EMPTY_VOICE_NOTES, EMPTY_REPORT, SERVICE_TYPE_LABELS } from "@/types/report";
import { saveDraft, getDraft, saveReport, clearDraft, generateId, getBusinessProfile, saveCustomer, deleteCustomer, getCustomers } from "@/lib/storage";
import { cn } from "@/lib/utils";
import DatePicker from "@/components/ui/DatePicker";
import StepIndicator, { REPORT_STEPS } from "@/components/StepIndicator";

interface NewReportFormProps {
  initialCustomer?: Customer | null;
  onBack: () => void;
  onGenerate: (job: JobDetails) => Promise<void>;
  onSaveForLater: () => void;
}

const SERVICE_TYPES = Object.keys(SERVICE_TYPE_LABELS) as ServiceType[];

const EMPTY_JOB: JobDetails = {
  customerName: "",
  serviceAddress: "",
  serviceType: "hvac-maintenance",
  jobDate: new Date().toISOString().split("T")[0],
  voiceNotes: EMPTY_VOICE_NOTES,
};

type FormStep = "customer-setup" | "recording" | "generating";

export default function NewReportForm({ initialCustomer, onBack, onGenerate, onSaveForLater }: NewReportFormProps) {
  const [linkedCustomer, setLinkedCustomer] = useState<Customer | null>(initialCustomer ?? null);
  const [suggestions, setSuggestions] = useState<Customer[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // True when the customer name field is linked to an existing customer record
  const isLinked = linkedCustomer !== null;

  const [formStep, setFormStep] = useState<FormStep>("customer-setup");
  const [job, setJob] = useState<JobDetails>(() => ({
    ...EMPTY_JOB,
    customerName: initialCustomer?.name ?? "",
    serviceAddress: initialCustomer?.address ?? "",
    // Pre-fill equipment from the customer's last known system — tech can edit if it changed
    equipment: initialCustomer?.equipment ?? "",
  }));
  const [customerForm, setCustomerForm] = useState({
    name: initialCustomer?.name ?? "",
    address: initialCustomer?.address ?? "",
    phone: initialCustomer?.phone ?? "",
    email: initialCustomer?.email ?? "",
    siteNotes: initialCustomer?.siteNotes ?? "",
  });
  // Both new and existing customers start collapsed
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  // Track the ID of a customer created during this session so we can remove it on discard
  const [newlyCreatedCustomerId, setNewlyCreatedCustomerId] = useState<string | null>(null);

  // Stable initial values for dirty-checking — computed once on mount
  const initialJob = useMemo(
    () => ({
      serviceType: "hvac-maintenance",
      equipment: initialCustomer?.equipment ?? "",
      jobDate: new Date().toISOString().split("T")[0],
      nextServiceDate: "",
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Dirty if any customer field OR job field has changed from its starting value
  const customerFormDirty = isLinked
    ? (
        customerForm.name !== (linkedCustomer.name) ||
        customerForm.address !== (linkedCustomer.address ?? "") ||
        customerForm.phone !== (linkedCustomer.phone ?? "") ||
        customerForm.email !== (linkedCustomer.email ?? "") ||
        customerForm.siteNotes !== (linkedCustomer.siteNotes ?? "")
      )
    : (
        customerForm.name.trim() !== "" ||
        customerForm.address.trim() !== "" ||
        customerForm.phone.trim() !== "" ||
        customerForm.email.trim() !== "" ||
        customerForm.siteNotes.trim() !== ""
      );

  const jobDirty =
    job.serviceType !== initialJob.serviceType ||
    (job.equipment ?? "") !== initialJob.equipment ||
    job.jobDate !== initialJob.jobDate ||
    (job.nextServiceDate ?? "") !== initialJob.nextServiceDate;

  const isDirty = customerFormDirty || jobDirty;

  // Restore draft on mount — only for new customers (no initialCustomer)
  useEffect(() => {
    if (initialCustomer) return;
    const draft = getDraft();
    if (!draft?.job) return;
    const raw = draft.job as JobDetails & { roughNotes?: string };
    // Migrate old draft format
    if (raw.roughNotes !== undefined && !raw.voiceNotes) {
      raw.voiceNotes = { ...EMPTY_VOICE_NOTES, jobNotes: raw.roughNotes };
    }
    if (raw.voiceNotes) {
      raw.voiceNotes = { ...EMPTY_VOICE_NOTES, ...raw.voiceNotes };
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setJob(raw as JobDetails);
    // Restore name + address into customerForm
    setCustomerForm((p) => ({
      ...p,
      name: raw.customerName || p.name,
      address: raw.serviceAddress || p.address,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep draft in sync
  useEffect(() => {
    saveDraft({ job });
  }, [job]);

  function handleNameChange(value: string) {
    setCustomerForm((p) => ({ ...p, name: value }));
    // Unlink if the user edits the name away from the linked customer
    if (linkedCustomer && value !== linkedCustomer.name) {
      setLinkedCustomer(null);
    }
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      const matches = getCustomers().filter((c) =>
        c.name.toLowerCase().includes(trimmed.toLowerCase())
      );
      setSuggestions(matches);
      setShowSuggestions(matches.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }

  function handleSelectCustomer(customer: Customer) {
    setLinkedCustomer(customer);
    setCustomerForm({
      name: customer.name,
      address: customer.address ?? "",
      phone: customer.phone ?? "",
      email: customer.email ?? "",
      siteNotes: customer.siteNotes ?? "",
    });
    setJob((prev) => ({
      ...prev,
      customerName: customer.name,
      serviceAddress: customer.address ?? "",
      equipment: customer.equipment ?? prev.equipment ?? "",
    }));
    setShowSuggestions(false);
  }

  async function doGenerate(jobToUse: JobDetails) {
    setGenerateError(null);
    try {
      await onGenerate(jobToUse);
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : "Generation failed. Please try again.");
    }
  }

  function handleRecordingComplete(finalNotes: VoiceNotes) {
    const updatedJob = { ...job, voiceNotes: finalNotes };
    setJob(updatedJob);
    setNewlyCreatedCustomerId(null); // Customer is now committed — don't delete on any future discard
    setFormStep("generating");
    window.scrollTo({ top: 0 });
    void doGenerate(updatedJob);
  }

  function handleSaveForLater() {
    const draft: ServiceReport = {
      id: generateId(),
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      business: getBusinessProfile(),
      job,
      report: { ...EMPTY_REPORT },
    };
    saveReport(draft);
    clearDraft();
    onSaveForLater();
  }

  function handleBack() {
    if (isDirty) {
      setShowDiscardConfirm(true);
    } else {
      onBack();
    }
  }

  function handleDiscard() {
    // If we created a brand-new customer during this session, remove it
    if (newlyCreatedCustomerId) {
      deleteCustomer(newlyCreatedCustomerId);
      setNewlyCreatedCustomerId(null);
    }
    clearDraft();
    setShowDiscardConfirm(false);
    onBack();
  }

  function handleSetupContinue() {
    const name = customerForm.name.trim();
    if (!name) return;

    const now = new Date().toISOString();
    const shared = {
      name,
      address: customerForm.address.trim(),
      phone: customerForm.phone.trim() || undefined,
      email: customerForm.email.trim() || undefined,
      siteNotes: customerForm.siteNotes.trim(),
      updatedAt: now,
    };

    if (linkedCustomer) {
      saveCustomer({ ...linkedCustomer, ...shared });
    } else {
      const newId = `cust_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      saveCustomer({ id: newId, createdAt: now, ...shared });
      setNewlyCreatedCustomerId(newId);
    }

    setJob((prev) => ({
      ...prev,
      customerName: name,
      serviceAddress: customerForm.address.trim(),
    }));

    setFormStep("recording");
    window.scrollTo({ top: 0 });
  }

  // ── Step: Recording ──────────────────────────────────────────────────────────
  if (formStep === "recording") {
    return (
      <FreeformRecordingFlow
        job={job}
        onBack={() => { setFormStep("customer-setup"); window.scrollTo({ top: 0 }); }}
        onComplete={handleRecordingComplete}
      />
    );
  }

  // ── Step: Generating ─────────────────────────────────────────────────────────
  if (formStep === "generating") {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col animate-screen-enter">
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
          {generateError ? (
            <div className="w-full max-w-sm space-y-4">
              <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 space-y-3">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-800">Couldn&apos;t generate report</p>
                    <p className="text-xs text-red-600 mt-0.5">{generateError}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => void doGenerate(job)}
                    className="flex-1 h-10 rounded-xl bg-red-500 text-sm font-semibold text-white active:bg-red-600 transition-colors"
                  >
                    Try again
                  </button>
                  <button
                    onClick={handleSaveForLater}
                    className="flex-1 h-10 rounded-xl bg-white border border-red-200 text-sm font-semibold text-red-700 active:bg-red-50 transition-colors"
                  >
                    Save for later
                  </button>
                </div>
              </div>
              <button
                onClick={() => { setFormStep("recording"); window.scrollTo({ top: 0 }); }}
                className="w-full h-10 text-sm font-semibold text-slate-500 hover:text-slate-600 transition-colors"
              >
                ← Back to recording
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-5 text-center">
              <div className="w-20 h-20 rounded-3xl bg-orange-50 flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-orange-400 animate-pulse" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-slate-900 text-lg">Writing your report…</p>
                <p className="text-sm text-slate-500">This usually takes 10–20 seconds.</p>
              </div>
              <Loader2 className="w-5 h-5 text-slate-500 animate-spin mt-2" />
            </div>
          )}
        </main>
      </div>
    );
  }

  // ── Step: Customer Setup ─────────────────────────────────────────────────────
  return (
    <>
    <div className="min-h-screen bg-slate-100 flex flex-col animate-screen-enter">
      <main className="flex-1 max-w-lg lg:max-w-4xl mx-auto w-full px-4 pt-10 lg:pt-8 pb-52 lg:pb-32 space-y-5">

        {/* Page title */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0 hover:bg-slate-50 active:bg-slate-100 transition-colors"
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex-1">New Job</h1>
        </div>
        <StepIndicator steps={REPORT_STEPS} currentStep={1} />

        {/* ── Customer section ────────────────────────────────────────────── */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Customer</h2>

          {!detailsExpanded ? (
            /* Collapsed — autocomplete search for unlinked, summary card when linked */
            <div className="bg-white rounded-2xl shadow-card px-4 py-4 space-y-3">
              {isLinked ? (
                /* Linked customer compact summary */
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{customerForm.name}</p>
                    {customerForm.address && (
                      <p className="text-xs text-slate-500 truncate mt-0.5">{customerForm.address}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setDetailsExpanded(true)}
                    className="flex items-center gap-1 text-xs font-semibold text-orange-500 active:text-orange-700 transition-colors shrink-0"
                  >
                    Edit <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                /* Unlinked — name input with autocomplete dropdown */
                <>
                  <div className="relative flex gap-2">
                    <Input
                      id="cf-name"
                      value={customerForm.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                      placeholder="Customer name"
                      autoFocus
                      autoComplete="off"
                      className="h-11 text-base bg-slate-50 border-slate-200 flex-1"
                    />
                    <button
                      type="button"
                      onClick={handleSetupContinue}
                      disabled={customerForm.name.trim().length < 2}
                      aria-label="Continue"
                      className={cn(
                        "h-11 w-11 rounded-xl flex items-center justify-center shrink-0 transition-all",
                        customerForm.name.trim().length >= 2
                          ? "bg-orange-500 text-white shadow-md shadow-orange-200 active:bg-orange-600"
                          : "bg-slate-200 text-slate-400 cursor-not-allowed"
                      )}
                    >
                      <ArrowRight className="w-5 h-5" />
                    </button>
                    {showSuggestions && suggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-slate-100 z-20 overflow-hidden">
                        {suggestions.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onMouseDown={(e) => { e.preventDefault(); handleSelectCustomer(c); }}
                            className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-slate-50 active:bg-slate-100 transition-colors border-b border-slate-50 last:border-0"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-900">{c.name}</p>
                              {c.address && (
                                <p className="text-xs text-slate-500 truncate">{c.address}</p>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setDetailsExpanded(true)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-orange-500 active:text-orange-700 transition-colors"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                    Add address &amp; contact details <span className="text-slate-400 font-normal">(optional)</span>
                  </button>
                </>
              )}
            </div>
          ) : (
            /* Expanded — full form for both new and existing */
            <div className="bg-white rounded-2xl shadow-card px-4 py-4 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">
                  {isLinked ? "Edit details" : "Address & contact details"}
                </p>
                <button
                  type="button"
                  onClick={() => setDetailsExpanded(false)}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-500 active:text-slate-600"
                >
                  Hide <ChevronUp className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cf-name" className="flex items-center gap-1.5 text-slate-500">
                  Name
                </Label>
                <Input
                  id="cf-name"
                  value={customerForm.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Customer name"
                  className="h-11 text-base bg-slate-50 border-slate-200"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cf-address" className="flex items-center gap-1.5 text-slate-500">
                  <MapPin className="w-3.5 h-3.5" />Address <span className="text-slate-400 font-normal">(optional)</span>
                </Label>
                <Input
                  id="cf-address"
                  value={customerForm.address}
                  onChange={(e) => setCustomerForm((p) => ({ ...p, address: e.target.value }))}
                  placeholder="Service address"
                  className="h-11 text-base bg-slate-50 border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="cf-phone" className="flex items-center gap-1.5 text-slate-500">
                    <Phone className="w-3.5 h-3.5" />Phone <span className="text-slate-400 font-normal">(optional)</span>
                  </Label>
                  <Input
                    id="cf-phone"
                    type="tel"
                    inputMode="tel"
                    value={customerForm.phone}
                    onChange={(e) => setCustomerForm((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="Phone number"
                    className="h-11 text-base bg-slate-50 border-slate-200"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cf-email" className="flex items-center gap-1.5 text-slate-500">
                    <Mail className="w-3.5 h-3.5" />Email <span className="text-slate-400 font-normal">(optional)</span>
                  </Label>
                  <Input
                    id="cf-email"
                    type="email"
                    inputMode="email"
                    value={customerForm.email}
                    onChange={(e) => setCustomerForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="Email address"
                    className="h-11 text-base bg-slate-50 border-slate-200"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cf-siteNotes" className="flex items-center gap-1.5 text-slate-500">
                  <StickyNote className="w-3.5 h-3.5" />Site Notes <span className="text-slate-400 font-normal">(optional)</span>
                </Label>
                <Input
                  id="cf-siteNotes"
                  value={customerForm.siteNotes}
                  onChange={(e) => setCustomerForm((p) => ({ ...p, siteNotes: e.target.value }))}
                  placeholder="Gate code, parking, dogs, access instructions…"
                  className="h-11 text-base bg-slate-50 border-slate-200"
                />
              </div>
            </div>
          )}
        </div>

        {/* ── This Job section ────────────────────────────────────────────── */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">This Job</h2>

          <div className="bg-white rounded-2xl shadow-card px-4 py-4 space-y-4">
            {/* Service type */}
            <div className="space-y-1.5">
              <Label htmlFor="serviceType" className="text-slate-500">Service Type</Label>
              <select
                id="serviceType"
                value={job.serviceType}
                onChange={(e) => setJob((prev) => ({
                  ...prev,
                  serviceType: e.target.value as ServiceType,
                  customServiceType: e.target.value !== "other" ? undefined : prev.customServiceType,
                }))}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-300"
              >
                {SERVICE_TYPES.map((type) => (
                  <option key={type} value={type}>{SERVICE_TYPE_LABELS[type]}</option>
                ))}
              </select>
              {job.serviceType === "other" && (
                <Input
                  id="customServiceType"
                  aria-label="Custom service type description"
                  placeholder="e.g. Boiler service, HRV maintenance, Gas fireplace"
                  value={job.customServiceType ?? ""}
                  onChange={(e) => setJob((prev) => ({ ...prev, customServiceType: e.target.value }))}
                  autoComplete="off"
                  className="h-11 text-base bg-slate-50 border-slate-200"
                />
              )}
            </div>

            {/* Equipment */}
            <div className="space-y-1.5">
              <Label htmlFor="equipment" className="flex items-center gap-1.5 text-slate-500">
                <Wrench className="w-3.5 h-3.5" />Equipment / System <span className="text-slate-400 font-normal">(optional)</span>
              </Label>
              <Input
                id="equipment"
                value={job.equipment ?? ""}
                onChange={(e) => setJob((prev) => ({ ...prev, equipment: e.target.value }))}
                placeholder="e.g. Daikin FTXM50W 6kW, installed 2018"
                className="h-11 text-base bg-slate-50 border-slate-200"
              />
            </div>

            {/* Date / Next Service */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="jobDate" className="text-slate-500">Job Date</Label>
                <DatePicker
                  id="jobDate"
                  value={job.jobDate}
                  onChange={(iso) => setJob((prev) => ({ ...prev, jobDate: iso }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="jobNextService" className="text-slate-500">Next Service <span className="text-slate-400 font-normal">(optional)</span></Label>
                <DatePicker
                  id="jobNextService"
                  value={job.nextServiceDate ?? ""}
                  onChange={(iso) => setJob((prev) => ({ ...prev, nextServiceDate: iso }))}
                  placeholder="Optional"
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

      {/* Discard changes bottom sheet */}
      {showDiscardConfirm && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50"
          onClick={() => setShowDiscardConfirm(false)}
        >
          <div
            className="bg-white rounded-t-3xl px-4 pt-3 pb-above-nav w-full max-w-lg mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-5" />
            <p className="text-base font-bold text-slate-900 text-center">Discard changes?</p>
            <p className="text-sm text-slate-500 text-center mt-1 mb-6">Your customer details won&apos;t be saved.</p>
            <div className="space-y-3">
              <button
                onClick={handleDiscard}
                className="w-full h-14 rounded-2xl bg-red-500 text-base font-bold text-white active:bg-red-600 transition-colors"
              >
                Discard
              </button>
              <button
                onClick={() => setShowDiscardConfirm(false)}
                className="w-full h-14 rounded-2xl bg-slate-100 text-base font-semibold text-slate-700 active:bg-slate-200 transition-colors"
              >
                Keep editing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky footer */}
      <div className="fixed left-0 right-0 z-20 bg-white border-t border-slate-100 above-nav">
        <div className="lg:pl-60">
        <div className="max-w-lg lg:max-w-4xl mx-auto px-4 pt-3 sticky-footer">
          <button
            onClick={handleSetupContinue}
            disabled={customerForm.name.trim().length < 2}
            className={cn(
              "w-full h-14 rounded-2xl text-base font-bold text-white flex items-center justify-center gap-2 transition-all",
              customerForm.name.trim().length >= 2
                ? "bg-orange-500 hover:bg-orange-600 active:bg-orange-700 shadow-md shadow-orange-200"
                : "bg-slate-300"
            )}
          >
            Start Recording
            <ArrowRight className="w-5 h-5" />
          </button>
          <button
            onClick={handleSaveForLater}
            className="w-full h-10 flex items-center justify-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-600 transition-colors"
          >
            <BookmarkCheck className="w-4 h-4" />
            Save for later
          </button>
        </div>
        </div>
      </div>
    </>
  );
}
