"use client";

import { useState } from "react";
import { Wrench, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUp } from "@/lib/supabase/auth";

interface SignupFormProps {
  onSuccess: () => void;
  onSignIn: () => void;
}

export default function SignupForm({ onSuccess, onSignIn }: SignupFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifyPending, setVerifyPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    const { user, error: authError } = await signUp(email, password);

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
      <div className="min-h-screen bg-slate-100 flex flex-col">
        <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full px-6 py-12">
          <div className="flex items-center gap-2.5 mb-10">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
              <Wrench className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-slate-900">JobWrap</span>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl p-6 text-center shadow-card">
            <p className="text-lg font-bold text-slate-900 mb-2">Check your email</p>
            <p className="text-sm text-slate-500">
              We sent a confirmation link to <strong>{email}</strong>. Click it to activate your
              account, then sign in.
            </p>
          </div>

          <button
            onClick={onSignIn}
            className="text-center text-sm text-orange-500 font-semibold hover:underline mt-6"
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full px-6 py-12">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-10">
          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
            <Wrench className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold text-slate-900">JobWrap</span>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-1">Create account</h1>
        <p className="text-slate-500 text-sm mb-8">Get started — it only takes a minute.</p>

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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="new-password"
              className="h-12 text-base"
            />
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

        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account?{" "}
          <button onClick={onSignIn} className="text-orange-500 font-semibold hover:underline">
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
