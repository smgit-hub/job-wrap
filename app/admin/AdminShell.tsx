"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  email: string;
  businessName: string;
  joinedAt: string;
  lastSignIn: string | null;
  disabled: boolean;
  reportCount: number;
  activeReportCount: number;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers30d: number;
  newUsers7d: number;
  newUsers30d: number;
  totalReports: number;
  activeReports: number;
}

interface AdminShellProps {
  users: AdminUser[];
  stats: AdminStats;
}

type Tab = "stats" | "users" | "emails";
type EmailTemplate = "welcome" | "getting-started" | "announcement";

const TEMPLATES: { id: EmailTemplate; label: string; description: string }[] = [
  { id: "welcome", label: "Welcome", description: "Introduce JobWrap to a new user" },
  { id: "getting-started", label: "Getting started", description: "3-step setup guide for new users" },
  { id: "announcement", label: "Announcement", description: "What's new — share a product update" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

function timeAgo(iso: string | null): string {
  if (!iso) return "Never";
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}yr ago`;
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, color }: { label: string; value: number | string; color?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 px-5 py-5">
      <p className={cn("text-3xl font-extrabold mb-1", color ?? "text-slate-900")}>{value}</p>
      <p className="text-slate-400 text-xs font-medium">{label}</p>
    </div>
  );
}

// ── Stats tab ─────────────────────────────────────────────────────────────────

function StatsTab({ stats, users }: { stats: AdminStats; users: AdminUser[] }) {
  const disabled = users.filter((u) => u.disabled).length;

  return (
    <div className="space-y-8">
      <section>
        <p className="text-xs font-semibold text-slate-400 tracking-widest mb-3">USERS</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard label="Total users" value={stats.totalUsers} />
          <StatCard label="Active (30d)" value={stats.activeUsers30d} color="text-green-600" />
          <StatCard label="Disabled" value={disabled} color={disabled > 0 ? "text-red-600" : "text-slate-900"} />
          <StatCard label="New signups (7d)" value={stats.newUsers7d} color="text-blue-600" />
          <StatCard label="New signups (30d)" value={stats.newUsers30d} color="text-blue-600" />
        </div>
      </section>

      <section>
        <p className="text-xs font-semibold text-slate-400 tracking-widest mb-3">REPORTS</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard label="Total reports" value={stats.totalReports} />
          <StatCard label="Active reports" value={stats.activeReports} color="text-green-600" />
          <StatCard label="Avg per user" value={stats.totalUsers ? Math.round(stats.activeReports / stats.totalUsers) : 0} />
        </div>
      </section>
    </div>
  );
}

// ── Users tab ─────────────────────────────────────────────────────────────────

function UsersTab({ users, onRefresh }: { users: AdminUser[]; onRefresh: () => void }) {
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const [localUsers, setLocalUsers] = useState(users);

  const filtered = localUsers.filter((u) =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.businessName.toLowerCase().includes(search.toLowerCase())
  );

  async function handleAction(userId: string, action: "disable" | "enable" | "delete") {
    if (action === "delete" && !confirm("Permanently delete this user and all their data?")) return;
    setPending((p) => ({ ...p, [userId]: true }));
    try {
      const res = await fetch("/api/admin/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, userId }),
      });
      if (!res.ok) {
        const { error } = await res.json() as { error: string };
        alert(error);
        return;
      }
      if (action === "delete") {
        setLocalUsers((prev) => prev.filter((u) => u.id !== userId));
      } else {
        setLocalUsers((prev) =>
          prev.map((u) => u.id === userId ? { ...u, disabled: action === "disable" } : u)
        );
      }
    } finally {
      setPending((p) => ({ ...p, [userId]: false }));
    }
  }

  const total = localUsers.length;
  const active = localUsers.filter((u) => !u.disabled).length;
  const disabled = localUsers.filter((u) => u.disabled).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total" value={total} />
        <StatCard label="Active" value={active} color="text-green-600" />
        <StatCard label="Disabled" value={disabled} color={disabled > 0 ? "text-red-600" : "text-slate-900"} />
      </div>

      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx={11} cy={11} r={8}/><path d="m21 21-4.35-4.35"/></svg>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by email or business…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white outline-none focus:ring-2 focus:ring-orange-200"
        />
      </div>

      <div className="space-y-2">
        {filtered.map((u) => (
          <div key={u.id} className="bg-white border border-slate-200 rounded-2xl px-5 py-4 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-slate-900 text-sm truncate">{u.businessName || u.email.split("@")[0]}</p>
                <span className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full",
                  u.disabled ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"
                )}>
                  {u.disabled ? "Disabled" : "Active"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{u.email}</p>
              <p className="text-xs text-slate-400 mt-1">
                Joined {formatDate(u.joinedAt)} · Last seen {timeAgo(u.lastSignIn)} · {u.activeReportCount} report{u.activeReportCount !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0 text-sm font-semibold">
              <button
                onClick={() => handleAction(u.id, u.disabled ? "enable" : "disable")}
                disabled={pending[u.id]}
                className="text-amber-600 hover:text-amber-700 disabled:opacity-40 transition-colors"
              >
                {u.disabled ? "Enable" : "Disable"}
              </button>
              <button
                onClick={() => handleAction(u.id, "delete")}
                disabled={pending[u.id]}
                className="text-red-500 hover:text-red-600 disabled:opacity-40 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-slate-400 py-10 text-sm">No users match your search.</p>
        )}
      </div>
    </div>
  );
}

// ── Emails tab ────────────────────────────────────────────────────────────────

const APP_URL = typeof window !== "undefined" ? window.location.origin : "https://jobwrap.app";

function EmailPreview({ type, template, subject, message }: {
  type: "template" | "broadcast";
  template?: EmailTemplate;
  subject?: string;
  message?: string;
}) {
  if (type === "template" && template === "welcome") {
    return (
      <div className="border border-slate-200 rounded-xl overflow-hidden text-sm">
        <div className="bg-orange-500 px-6 py-4">
          <span className="text-white font-extrabold text-base tracking-tight">JobWrap</span>
        </div>
        <div className="bg-white px-6 py-6 space-y-3">
          <p className="text-slate-900 font-bold text-lg">Welcome to JobWrap 👋</p>
          <p className="text-slate-500 leading-relaxed">Thanks for signing up. JobWrap is built for tradies who want to spend less time on paperwork and more time on the tools.</p>
          <p className="text-slate-500 leading-relaxed">Here&apos;s how it works: you do the job, open the app, tap <strong>+</strong>, and speak a quick voice note about what you found and what you did. JobWrap turns that into a professional service report — formatted, branded with your logo, and ready to send to your customer in seconds.</p>
          <p className="text-slate-500 leading-relaxed">No typing up notes at the end of the day. No chasing customers for signatures. Just tap, talk, done.</p>
          <div>
            <span className="inline-block mt-2 px-4 py-2 bg-orange-500 text-white rounded-lg font-semibold text-sm">Create your first report →</span>
          </div>
          <p className="text-slate-400 text-xs pt-2 leading-relaxed">If you have any questions or run into anything, just reply to this email — I read every one.<br /><br />Sean<br /><span className="text-slate-300">Founder, JobWrap</span></p>
        </div>
      </div>
    );
  }

  if (type === "template" && template === "getting-started") {
    return (
      <div className="border border-slate-200 rounded-xl overflow-hidden text-sm">
        <div className="bg-orange-500 px-6 py-4">
          <span className="text-white font-extrabold text-base tracking-tight">JobWrap</span>
        </div>
        <div className="bg-white px-6 py-6 space-y-3">
          <p className="text-slate-900 font-bold text-lg">3 steps to get the most out of JobWrap</p>
          <p className="text-slate-500 leading-relaxed">Here&apos;s how to hit the ground running:</p>
          <ol className="text-slate-500 leading-relaxed space-y-2 pl-4 list-decimal">
            <li><strong>Set up your branding</strong> — Go to Settings and add your business name, logo, and brand colour. It takes two minutes and makes every report look professional.</li>
            <li><strong>Create your first report</strong> — Tap the <strong>+</strong> button, enter the job details, then use voice notes to describe what you found and what you did. JobWrap turns that into a structured service report automatically.</li>
            <li><strong>Send it to your customer</strong> — From the report preview, tap the share button to email a PDF, download it, or copy a shareable link — all in one tap.</li>
          </ol>
          <div>
            <span className="inline-block mt-2 px-4 py-2 bg-orange-500 text-white rounded-lg font-semibold text-sm">Open JobWrap →</span>
          </div>
          <p className="text-slate-400 text-xs pt-2 leading-relaxed">If you get stuck, just reply to this email — I read every one.<br /><br />Sean</p>
        </div>
      </div>
    );
  }

  const title = type === "template" ? (subject || "What's new in JobWrap") : (subject || "Your subject here");
  const body = type === "template" ? (message || "Your announcement here…") : (message || "Your message here…");

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden text-sm">
      <div className="bg-orange-500 px-6 py-4">
        <span className="text-white font-extrabold text-base tracking-tight">JobWrap</span>
      </div>
      <div className="bg-white px-6 py-6 space-y-3">
        <p className="text-slate-900 font-bold text-lg">{title}</p>
        <p className="text-slate-500 leading-relaxed">{body}</p>
        <div>
          <span className="inline-block mt-2 px-4 py-2 bg-orange-500 text-white rounded-lg font-semibold text-sm">Open JobWrap →</span>
        </div>
        <p className="text-slate-400 text-xs pt-2">
          This message was sent to you by the JobWrap team.{" "}
          <span className="underline">{APP_URL}</span>
        </p>
        <p className="text-slate-300 text-xs">© 2025 JobWrap — jobwrap.app</p>
      </div>
    </div>
  );
}

function EmailsTab({ users }: { users: AdminUser[] }) {
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate>("welcome");
  const [templateMessage, setTemplateMessage] = useState("");
  const [templateSubject, setTemplateSubject] = useState("");
  const [showTemplatePreview, setShowTemplatePreview] = useState(true);
  const [templateSending, setTemplateSending] = useState(false);
  const [templateResult, setTemplateResult] = useState<string | null>(null);

  const [broadcastSubject, setBroadcastSubject] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [showBroadcastPreview, setShowBroadcastPreview] = useState(true);
  const [broadcastSending, setBroadcastSending] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<string | null>(null);

  const [individualSearch, setIndividualSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [individualTemplate, setIndividualTemplate] = useState<EmailTemplate>("welcome");
  const [individualSending, setIndividualSending] = useState(false);
  const [individualResult, setIndividualResult] = useState<string | null>(null);

  const activeUsers = users.filter((u) => !u.disabled);

  const individualMatches = activeUsers.filter((u) =>
    u.email.toLowerCase().includes(individualSearch.toLowerCase()) ||
    u.businessName.toLowerCase().includes(individualSearch.toLowerCase())
  ).slice(0, 5);

  const selectedUser = users.find((u) => u.id === selectedUserId);

  async function sendTemplate() {
    setTemplateSending(true);
    setTemplateResult(null);
    try {
      const res = await fetch("/api/admin/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "template",
          template: selectedTemplate,
          subject: templateSubject || undefined,
          message: templateMessage || undefined,
          toAll: true,
        }),
      });
      const data = await res.json() as { ok?: boolean; sent?: number; error?: string };
      setTemplateResult(data.ok ? `Sent to ${data.sent} user${data.sent !== 1 ? "s" : ""}` : (data.error ?? "Failed"));
    } finally {
      setTemplateSending(false);
    }
  }

  async function sendBroadcast() {
    if (!broadcastSubject.trim() || !broadcastMessage.trim()) {
      alert("Subject and message are required.");
      return;
    }
    setBroadcastSending(true);
    setBroadcastResult(null);
    try {
      const res = await fetch("/api/admin/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "broadcast",
          subject: broadcastSubject,
          message: broadcastMessage,
          toAll: true,
        }),
      });
      const data = await res.json() as { ok?: boolean; sent?: number; error?: string };
      setBroadcastResult(data.ok ? `Sent to ${data.sent} user${data.sent !== 1 ? "s" : ""}` : (data.error ?? "Failed"));
    } finally {
      setBroadcastSending(false);
    }
  }

  async function sendToIndividual() {
    if (!selectedUserId) return;
    setIndividualSending(true);
    setIndividualResult(null);
    try {
      const res = await fetch("/api/admin/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "template",
          template: individualTemplate,
          toUserId: selectedUserId,
        }),
      });
      const data = await res.json() as { ok?: boolean; sent?: number; error?: string };
      setIndividualResult(data.ok ? "Sent!" : (data.error ?? "Failed"));
    } finally {
      setIndividualSending(false);
    }
  }

  return (
    <div className="space-y-8">

      {/* Template emails */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
        <p className="text-xs font-semibold text-slate-400 tracking-widest">TEMPLATE EMAILS</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTemplate(t.id)}
              className={cn(
                "text-left border rounded-xl px-3 py-2.5 transition-colors",
                selectedTemplate === t.id
                  ? "border-orange-400 bg-orange-50"
                  : "border-slate-200 hover:border-slate-300"
              )}
            >
              <p className={cn("text-sm font-semibold", selectedTemplate === t.id ? "text-orange-600" : "text-slate-700")}>{t.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{t.description}</p>
            </button>
          ))}
        </div>

        {selectedTemplate === "announcement" && (
          <div className="space-y-2">
            <input
              value={templateSubject}
              onChange={(e) => setTemplateSubject(e.target.value)}
              placeholder="Subject…"
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-200"
            />
            <textarea
              value={templateMessage}
              onChange={(e) => setTemplateMessage(e.target.value)}
              placeholder="Announcement message…"
              rows={4}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-200 resize-none"
            />
          </div>
        )}

        <p className="text-xs text-slate-400">Audience: All users ({activeUsers.length})</p>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowTemplatePreview((p) => !p)}
            className="text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
          >
            {showTemplatePreview ? "Hide preview" : "Show preview"}
          </button>
          <button
            onClick={sendTemplate}
            disabled={templateSending}
            className="px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-50 transition-colors"
          >
            {templateSending ? "Sending…" : `Send ${TEMPLATES.find((t) => t.id === selectedTemplate)?.label.toLowerCase()}`}
          </button>
          {templateResult && (
            <span className={cn("text-sm font-medium", templateResult.startsWith("Sent") ? "text-green-600" : "text-red-600")}>
              {templateResult}
            </span>
          )}
        </div>

        {showTemplatePreview && (
          <div>
            <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wider">Preview — {TEMPLATES.find((t) => t.id === selectedTemplate)?.label}</p>
            <EmailPreview type="template" template={selectedTemplate} subject={templateSubject} message={templateMessage} />
          </div>
        )}
      </section>

      {/* Custom broadcast */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
        <div>
          <p className="text-xs font-semibold text-slate-400 tracking-widest">CUSTOM BROADCAST</p>
          <p className="text-xs text-slate-400 mt-1">Write your own subject and message.</p>
        </div>

        <p className="text-xs text-slate-400">Audience: All users ({activeUsers.length})</p>

        <input
          value={broadcastSubject}
          onChange={(e) => setBroadcastSubject(e.target.value)}
          placeholder="Subject"
          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-200"
        />
        <textarea
          value={broadcastMessage}
          onChange={(e) => setBroadcastMessage(e.target.value)}
          placeholder="Message…"
          rows={5}
          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-200 resize-none"
        />

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowBroadcastPreview((p) => !p)}
            className="text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
          >
            {showBroadcastPreview ? "Hide preview" : "Show preview"}
          </button>
          <button
            onClick={sendBroadcast}
            disabled={broadcastSending}
            className="px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-50 transition-colors"
          >
            {broadcastSending ? "Sending…" : "Send broadcast"}
          </button>
          {broadcastResult && (
            <span className={cn("text-sm font-medium", broadcastResult.startsWith("Sent") ? "text-green-600" : "text-red-600")}>
              {broadcastResult}
            </span>
          )}
        </div>

        {showBroadcastPreview && (
          <div>
            <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wider">Preview</p>
            <EmailPreview type="broadcast" subject={broadcastSubject} message={broadcastMessage} />
          </div>
        )}
      </section>

      {/* Send to individual */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
        <div>
          <p className="text-xs font-semibold text-slate-400 tracking-widest">SEND TO INDIVIDUAL</p>
          <p className="text-xs text-slate-400 mt-1">Find a user and send them a template.</p>
        </div>

        <div>
          <p className="text-xs font-medium text-slate-500 mb-1">User</p>
          {selectedUser ? (
            <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2.5">
              <span className="text-sm text-slate-800 flex-1">{selectedUser.email}</span>
              <button onClick={() => { setSelectedUserId(null); setIndividualSearch(""); setIndividualResult(null); }} className="text-xs text-slate-400 hover:text-slate-600">✕</button>
            </div>
          ) : (
            <div className="relative">
              <input
                value={individualSearch}
                onChange={(e) => setIndividualSearch(e.target.value)}
                placeholder="Search by name or email…"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-200"
              />
              {individualSearch && individualMatches.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-10">
                  {individualMatches.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => { setSelectedUserId(u.id); setIndividualSearch(""); setIndividualResult(null); }}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors"
                    >
                      <span className="font-medium text-slate-800">{u.businessName || u.email.split("@")[0]}</span>
                      <span className="text-slate-400 ml-2">{u.email}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <p className="text-xs font-medium text-slate-500 mb-2">Template</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => setIndividualTemplate(t.id)}
                className={cn(
                  "text-left border rounded-xl px-3 py-2.5 transition-colors",
                  individualTemplate === t.id
                    ? "border-orange-400 bg-orange-50"
                    : "border-slate-200 hover:border-slate-300"
                )}
              >
                <p className={cn("text-sm font-semibold", individualTemplate === t.id ? "text-orange-600" : "text-slate-700")}>{t.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{t.description}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={sendToIndividual}
            disabled={!selectedUserId || individualSending}
            className="px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-40 transition-colors"
          >
            {individualSending ? "Sending…" : "Send to user"}
          </button>
          {individualResult && (
            <span className={cn("text-sm font-medium", individualResult === "Sent!" ? "text-green-600" : "text-red-600")}>
              {individualResult}
            </span>
          )}
        </div>
      </section>

    </div>
  );
}

// ── Shell ─────────────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string }[] = [
  { id: "stats", label: "Stats" },
  { id: "users", label: "Users" },
  { id: "emails", label: "Emails" },
];

export default function AdminShell({ users, stats }: AdminShellProps) {
  const [tab, setTab] = useState<Tab>("stats");
  const [key, setKey] = useState(0);

  function refresh() {
    window.location.reload();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 pt-8 pb-16">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <a href="/app" className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M15 18l-6-6 6-6"/></svg>
            </a>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Platform Admin</h1>
          </div>
          <button
            onClick={refresh}
            className="text-sm font-semibold text-orange-500 hover:text-orange-600 transition-colors"
          >
            Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-slate-200 mb-8">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "pb-3 text-sm font-semibold border-b-2 -mb-px transition-colors",
                tab === t.id
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {tab === "stats" && <StatsTab stats={stats} users={users} />}
        {tab === "users" && <UsersTab key={key} users={users} onRefresh={() => setKey((k) => k + 1)} />}
        {tab === "emails" && <EmailsTab users={users} />}
      </div>
    </div>
  );
}
