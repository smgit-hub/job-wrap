"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUp, resendConfirmation } from "@/lib/supabase/auth";
import { isDisposableEmail } from "@/lib/disposableEmailDomains";
import LandingFooter from "@/components/landing/LandingFooter";

interface SignupFormProps {
  onSuccess: () => void;
  onSignIn: () => void;
}

export default function SignupForm({ onSuccess, onSignIn }: SignupFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifyPending, setVerifyPending] = useState(false);
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent">("idle");

  async function handleResend() {
    if (resendState !== "idle") return;
    setResendState("sending");
    await resendConfirmation(email);
    setResendState("sent");
    setTimeout(() => setResendState("idle"), 4000);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (isDisposableEmail(email)) {
      setError("Please use a permanent email address — disposable/temporary email providers aren't supported.");
      return;
    }

    setLoading(true);

    const { user, error: authError } = await signUp(email, password, name.trim());

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (user && !user.confirmed_at) {
      setVerifyPending(true);
      setLoading(false);
      return;
    }

    onSuccess();
  }

  if (verifyPending) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full px-6 py-12">
          <div className="flex items-center gap-2.5 mb-10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/icon-192.png?v=3" alt="JobWrap" className="w-10 h-10 shrink-0 object-cover" />
            <span className="text-2xl font-bold text-slate-900">JobWrap</span>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-card space-y-5">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center">
                <Mail className="w-7 h-7 text-orange-500" />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900">Check your email</p>
                <p className="text-sm text-slate-500 mt-1">
                  We sent a confirmation link to
                </p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">{email}</p>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Tap the link in the email to activate your account, then come back here to sign in. Check your spam folder if you don&apos;t see it.
              </p>
            </div>

            <a
              href={`mailto:${email}`}
              className="w-full h-12 rounded-xl bg-orange-500 text-white text-sm font-semibold flex items-center justify-center gap-2 active:bg-orange-600 transition-colors"
            >
              <Mail className="w-4 h-4" />
              Open Mail app
            </a>

            <button
              onClick={handleResend}
              disabled={resendState !== "idle"}
              className="w-full h-12 rounded-xl bg-slate-100 text-slate-600 text-sm font-semibold active:bg-slate-200 transition-colors disabled:opacity-60"
            >
              {resendState === "sending" ? "Sending…" : resendState === "sent" ? "Email sent ✓" : "Resend email"}
            </button>
          </div>

          <button
            onClick={onSignIn}
            className="text-center text-sm text-orange-500 font-semibold hover:underline mt-6"
          >
            Back to sign in
          </button>
        </div>
      <LandingFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full px-6 py-12">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 mb-10 w-fit">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-192.png?v=3" alt="JobWrap" className="w-10 h-10 shrink-0 object-cover" />
          <span className="text-2xl font-bold text-slate-900">JobWrap</span>
        </Link>

        <h1 className="text-2xl font-bold text-slate-900 mb-1">Create account</h1>
        <p className="text-slate-500 text-sm mb-1">For air conditioning &amp; HVAC technicians.</p>
        <p className="text-slate-400 text-xs mb-8">14-day free trial · then $9/month · cancel any time</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="name">Technician name</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Morgan"
              required
              autoComplete="name"
              className="h-12 text-base"
            />
          </div>

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
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                required
                autoComplete="new-password"
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
            {loading ? "Creating account…" : "Create account"}
          </Button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-4 leading-relaxed">
          By creating an account you agree to our{" "}
          <Link href="/terms" className="underline hover:text-slate-600">Terms</Link>
          {" "}and{" "}
          <Link href="/refund-policy" className="underline hover:text-slate-600">Refund Policy</Link>.
        </p>

        <p className="text-center text-sm text-slate-500 mt-4">
          Already have an account?{" "}
          <button onClick={onSignIn} className="text-orange-500 font-semibold hover:underline">
            Sign in
          </button>
        </p>

      </div>
      <LandingFooter />
    </div>
  );
}
