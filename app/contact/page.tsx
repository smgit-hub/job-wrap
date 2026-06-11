"use client";

import { useState } from "react";
import LandingFooter from "@/components/landing/LandingFooter";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");

    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, message }),
    });

    if (res.ok) {
      setStatus("sent");
      setName("");
      setEmail("");
      setMessage("");
    } else {
      setStatus("error");
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <main className="flex-1 max-w-lg mx-auto px-6 py-16 w-full">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 mb-10 w-fit">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-192.png?v=3" alt="JobWrap" className="w-10 h-10 shrink-0 object-cover" />
          <span className="text-2xl font-bold text-slate-900">JobWrap</span>
        </Link>

        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Get in touch</h1>
        <p className="text-slate-500 mb-10">Have a question or need help? Send us a message and we&apos;ll get back to you.</p>

        {status === "sent" ? (
          <div className="rounded-xl bg-green-50 border border-green-100 p-8 text-center">
            <p className="text-green-700 font-semibold text-lg mb-1">Message sent!</p>
            <p className="text-green-600 text-sm">Thanks for reaching out. We&apos;ll reply as soon as we can.</p>
            <button
              onClick={() => setStatus("idle")}
              className="mt-6 text-sm text-slate-500 hover:text-slate-800 underline"
            >
              Send another message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">
                Your name
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Smith"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                Your email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@example.com"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-1.5">
                Message
              </label>
              <textarea
                id="message"
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="How can we help?"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-none"
              />
            </div>

            {status === "error" && (
              <p className="text-sm text-red-600">Something went wrong. Please try again.</p>
            )}

            <button
              type="submit"
              disabled={status === "sending"}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
            >
              {status === "sending" ? "Sending…" : "Send message"}
            </button>
          </form>
        )}

        <div className="mt-10">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to JobWrap
          </Link>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
