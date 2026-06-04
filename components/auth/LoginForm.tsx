"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import Link from "next/link";
import { Eye, EyeOff, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInWithPassword, resetPassword } from "@/lib/supabase/auth";

interface LoginFormProps {
  onSuccess: () => void;
  onSignUp: () => void;
}

export default function LoginForm({ onSuccess, onSignUp }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotState, setForgotState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [forgotError, setForgotError] = useState<string | null>(null);

  async function handleForgot() {
    if (!forgotEmail.includes("@")) { setForgotError("Enter a valid email address."); return; }
    setForgotState("sending");
    setForgotError(null);
    const { error: err } = await resetPassword(forgotEmail);
    if (err) { setForgotState("error"); setForgotError(err.message); return; }
    setForgotState("sent");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: authError } = await signInWithPassword(email, password);

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    onSuccess();
  }

  if (showForgot) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col">
        <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full px-6 py-12">
          <div className="flex items-center gap-2.5 mb-10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/icon-192.png?v=3" alt="JobWrap" className="w-10 h-10 shrink-0 object-cover" />
            <span className="text-2xl font-bold text-slate-900">JobWrap</span>
          </div>

          {forgotState === "sent" ? (
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-card space-y-5">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center">
                  <Mail className="w-7 h-7 text-orange-500" />
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-900">Check your email</p>
                  <p className="text-sm text-slate-500 mt-1">We sent a password reset link to</p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">{forgotEmail}</p>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Click the link in the email to reset your password. Check your spam folder if you don&apos;t see it.
                </p>
              </div>
              <a
                href={`mailto:${forgotEmail}`}
                className="w-full h-12 rounded-xl bg-orange-500 text-white text-sm font-semibold flex items-center justify-center gap-2 active:bg-orange-600 transition-colors"
              >
                <Mail className="w-4 h-4" />
                Open Mail app
              </a>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-slate-900 mb-1">Reset password</h1>
              <p className="text-slate-500 text-sm mb-8">Enter your email and we&apos;ll send you a reset link.</p>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="forgot-email">Email</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="h-12 text-base"
                  />
                </div>
                {forgotError && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{forgotError}</p>
                )}
                <Button
                  onClick={handleForgot}
                  disabled={forgotState === "sending"}
                  className="w-full h-12 text-base font-semibold bg-orange-500 hover:bg-orange-600 rounded-xl"
                >
                  {forgotState === "sending" ? "Sending…" : "Send reset link"}
                </Button>
              </div>
            </>
          )}

          <button
            onClick={() => { setShowForgot(false); setForgotState("idle"); setForgotError(null); }}
            className="text-center text-sm text-orange-500 font-semibold hover:underline mt-6"
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  // Replace the whole form with a spinner once signing in — prevents the login
  // page flashing during the navigation to /app.
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center gap-5 text-center">
        <div className="w-20 h-20 rounded-3xl bg-orange-50 flex items-center justify-center">
          <Sparkles className="w-10 h-10 text-orange-400 animate-pulse" />
        </div>
        <div className="space-y-1">
          <p className="font-bold text-slate-900 text-lg">JobWrap</p>
          <p className="text-sm text-slate-500">Signing in…</p>
        </div>
        <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full px-6 py-12">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-192.png?v=3" alt="JobWrap" className="w-10 h-10 shrink-0 object-cover" />
          <span className="text-2xl font-bold text-slate-900">JobWrap</span>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-1">Sign in</h1>
        <p className="text-slate-500 text-sm mb-6">For air conditioning & HVAC technicians.</p>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs text-slate-400 font-medium">sign in</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              className="h-12 text-base"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <button
                type="button"
                onClick={() => { setShowForgot(true); setForgotEmail(email); }}
                className="text-xs text-orange-500 font-semibold hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="h-12 text-base pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-600 p-0.5"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 text-base font-semibold bg-orange-500 hover:bg-orange-600 rounded-xl"
          >
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          No account?{" "}
          <button onClick={onSignUp} className="text-orange-500 font-semibold hover:underline">
            Create one
          </button>
        </p>

        <p className="text-center text-xs text-slate-500 mt-4">
          <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
            {" · "}
          <Link href="/terms" className="hover:underline">Terms of Service</Link>
        </p>
      </div>
    </div>
  );
}
