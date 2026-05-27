"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, Search, UserPlus, MapPin, Pencil, Trash2, CheckCircle2, StickyNote, Phone, Mail, ArrowRight, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Customer } from "@/types/report";
import { getCustomers, saveCustomer, deleteCustomer, migrateCustomersFromReports } from "@/lib/storage";

interface CustomerSelectScreenProps {
  onBack: () => void;
  onSelectCustomer: (customer: Customer) => void;
  onNewCustomer: () => void;
  /** When true: header reads "Customers", tapping a row opens edit, new customer is created inline */
  standalone?: boolean;
}

type Mode = "list" | "edit" | "new";


export default function CustomerSelectScreen({
  onBack,
  onSelectCustomer,
  onNewCustomer,
  standalone = false,
}: CustomerSelectScreenProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<Mode>("list");
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editForm, setEditForm] = useState({ name: "", address: "", siteNotes: "", phone: "", email: "" });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    migrateCustomersFromReports();
    reload();
  }, []);

  function reload() {
    setCustomers(getCustomers().sort((a, b) => a.name.localeCompare(b.name)));
  }

  function openEdit(e: React.MouseEvent, customer: Customer) {
    e.stopPropagation();
    setEditingCustomer(customer);
    setEditForm({
      name: customer.name,
      address: customer.address,
      siteNotes: customer.siteNotes,
      phone: customer.phone ?? "",
      email: customer.email ?? "",
    });
    setConfirmDelete(false);
    setSaved(false);
    setMode("edit");
  }

  function openNew() {
    const now = new Date().toISOString();
    setEditingCustomer({
      id: `cust_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: "",
      address: "",
      siteNotes: "",
      createdAt: now,
      updatedAt: now,
    });
    setEditForm({ name: "", address: "", siteNotes: "", phone: "", email: "" });
    setConfirmDelete(false);
    setSaved(false);
    setMode("new");
  }

  function handleSaveEdit() {
    if (!editingCustomer || !editForm.name.trim()) return;
    saveCustomer({
      ...editingCustomer,
      name: editForm.name.trim(),
      address: editForm.address.trim(),
      siteNotes: editForm.siteNotes.trim(),
      phone: editForm.phone.trim() || undefined,
      email: editForm.email.trim() || undefined,
      updatedAt: new Date().toISOString(),
    });
    reload();
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setMode("list");
    }, 1200);
  }

  function handleDelete() {
    if (!editingCustomer) return;
    deleteCustomer(editingCustomer.id);
    reload();
    setMode("list");
  }

  function handleStartJob() {
    if (!editingCustomer || !editForm.name.trim()) return;
    // Save any unsaved edits before handing off to the job flow
    const updated: Customer = {
      ...editingCustomer,
      name: editForm.name.trim(),
      address: editForm.address.trim(),
      siteNotes: editForm.siteNotes.trim(),
      phone: editForm.phone.trim() || undefined,
      email: editForm.email.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };
    saveCustomer(updated);
    onSelectCustomer(updated);
  }

  const filtered = query.trim()
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.address.toLowerCase().includes(query.toLowerCase())
      )
    : customers;

  // ── Edit / New mode ───────────────────────────────────────────────────────
  if ((mode === "edit" || mode === "new") && editingCustomer) {
    const isNew = mode === "new";
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col animate-screen-enter">
        <header className="bg-white border-b border-slate-100 sticky top-0 z-10 shrink-0">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center">
            <button
              onClick={() => setMode("list")}
              className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 active:bg-slate-200 transition-colors"
              aria-label="Back"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <span className="flex-1 font-bold text-slate-900 ml-3">{isNew ? "New Customer" : "Edit Customer"}</span>
            <div className="w-9 h-9 flex items-center justify-center shrink-0">
              {saved && <CheckCircle2 className="w-4 h-4 text-green-500" />}
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 pb-32 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-name">Name</Label>
            <Input
              id="edit-name"
              value={editForm.name}
              onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Customer name"
              className="h-12 text-base bg-white"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-address">Address</Label>
            <Input
              id="edit-address"
              value={editForm.address}
              onChange={(e) => setEditForm((p) => ({ ...p, address: e.target.value }))}
              placeholder="Service address"
              className="h-12 text-base bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-phone" className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                Phone
              </Label>
              <Input
                id="edit-phone"
                type="tel"
                value={editForm.phone}
                onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="+1 555 000 0000"
                className="h-12 text-base bg-white"
                inputMode="tel"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-email" className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                Email
              </Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="name@email.com"
                className="h-12 text-base bg-white"
                inputMode="email"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-notes" className="flex items-center gap-1.5">
              <StickyNote className="w-3.5 h-3.5 text-slate-400" />
              Site Notes <span className="text-slate-400 font-normal">(optional)</span>
            </Label>
            <Input
              id="edit-notes"
              value={editForm.siteNotes}
              onChange={(e) => setEditForm((p) => ({ ...p, siteNotes: e.target.value }))}
              placeholder="Gate code, parking, dogs, access instructions…"
              className="h-12 text-base bg-white"
            />
          </div>

          {/* Delete — hidden when creating a new customer */}
          {!isNew && (
            !confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-2 text-sm text-red-400 font-medium pt-2 active:text-red-600 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete customer
              </button>
            ) : (
              <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 space-y-3">
                <p className="text-sm font-semibold text-red-800">Delete {editingCustomer.name}?</p>
                <p className="text-xs text-red-600">Their service reports will remain. This can&apos;t be undone.</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="flex-1 h-10 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-600 active:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex-1 h-10 rounded-xl bg-red-500 text-sm font-semibold text-white active:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          )}
        </main>

        {/* Footer actions */}
        <div className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-slate-100">
          <div className="max-w-lg mx-auto px-4 pt-3 sticky-footer space-y-2">
            {/* Standalone edit: Start job is the primary CTA */}
            {!isNew && standalone && (
              <button
                onClick={handleStartJob}
                disabled={!editForm.name.trim()}
                className="w-full h-14 rounded-2xl text-base font-bold text-white bg-orange-500 hover:bg-orange-600 active:bg-orange-700 disabled:bg-slate-300 transition-colors shadow-md shadow-orange-200/50 flex items-center justify-center gap-2"
              >
                Start job for {editForm.name.trim() || "customer"}
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={handleSaveEdit}
              disabled={!editForm.name.trim()}
              className={
                !isNew && standalone
                  ? "w-full h-11 rounded-2xl text-sm font-semibold text-slate-600 bg-white border border-slate-200 active:bg-slate-50 transition-colors"
                  : "w-full h-14 rounded-2xl text-base font-bold text-white bg-orange-500 hover:bg-orange-600 active:bg-orange-700 disabled:bg-slate-300 transition-colors shadow-md shadow-orange-200/50"
              }
            >
              {isNew ? "Add Customer" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── List mode ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col animate-screen-enter">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10 shrink-0">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 active:bg-slate-200 transition-colors"
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <span className="flex-1 font-bold text-slate-900 ml-3">Customers</span>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-5 space-y-3">

        {/* Search */}
        {customers.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search customers…"
              autoFocus
              className="w-full h-12 pl-10 pr-4 rounded-2xl bg-white border border-slate-200 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
            />
          </div>
        )}

        {/* New customer button — always at top when customers exist */}
        {customers.length > 0 && (
          <button
            onClick={standalone ? openNew : onNewCustomer}
            className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl border-2 border-dashed border-orange-200 bg-orange-50 text-orange-500 active:bg-orange-100 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
              <UserPlus className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-sm">New customer</p>
              <p className="text-xs text-orange-400">Add a new customer record</p>
            </div>
          </button>
        )}

        {/* Customer list */}
        {filtered.length > 0 && (
          <div className="bg-white rounded-2xl shadow-card overflow-hidden divide-y divide-slate-50">
            {filtered.map((customer) => (
              <button
                key={customer.id}
                onClick={() => onSelectCustomer(customer)}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-slate-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 leading-snug truncate">
                    {customer.name}
                  </p>
                  {customer.address && (
                    <span className="text-xs text-slate-400 truncate flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 shrink-0" />
                      {customer.address}
                    </span>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
              </button>
            ))}
          </div>
        )}

        {/* No results */}
        {query.trim() && filtered.length === 0 && (
          <div className="text-center py-8">
            <p className="text-slate-500 text-sm">No customers match &ldquo;{query}&rdquo;</p>
            <p className="text-slate-400 text-xs mt-1">Start fresh and they&apos;ll be saved automatically</p>
          </div>
        )}

        {/* Empty state */}
        {customers.length === 0 && (
          <div className="text-center py-10">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <UserPlus className="w-6 h-6 text-slate-400" />
            </div>
            <p className="font-semibold text-slate-700">No customers yet</p>
            <p className="text-sm text-slate-400 mt-1">
              Customers are saved automatically when you complete a job
            </p>
          </div>
        )}

        {/* New customer button — empty state only (when customers exist, button is at top) */}
        {customers.length === 0 && (
          <button
            onClick={standalone ? openNew : onNewCustomer}
            className="w-full h-14 rounded-2xl text-base font-bold text-white bg-orange-500 hover:bg-orange-600 active:bg-orange-700 transition-colors shadow-md shadow-orange-200/50 flex items-center justify-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            New customer
          </button>
        )}

        {customers.length > 0 && (
          <p className="text-center text-xs text-slate-400 pb-4">
            Customers are saved and updated automatically after each job
          </p>
        )}

      </main>
    </div>
  );
}
