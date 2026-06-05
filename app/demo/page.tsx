"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const DEMO_EMAIL = "demo@jobwrap.app";

export default function DemoPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;

    // Already signed in as a real user — send straight to app, don't override session
    if (user && user.email !== DEMO_EMAIL) {
      router.replace("/app");
      return;
    }

    // Already signed in as demo — go to app
    if (user && user.email === DEMO_EMAIL) {
      router.replace("/app");
      return;
    }

    // Not signed in — call server-side demo login (password never reaches client)
    const client = getSupabaseBrowserClient();
    if (!client) {
      Promise.resolve().then(() => setError("Demo unavailable — please try again later."));
      return;
    }

    fetch("/api/demo-login", { method: "POST" })
      .then((res) => res.json())
      .then(async (data: { access_token?: string; refresh_token?: string; error?: string }) => {
        if (!data.access_token || !data.refresh_token) {
          setError("Demo unavailable — please try again later.");
          return;
        }
        await client.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        });
        router.replace("/app");
      })
      .catch(() => {
        setError("Demo unavailable — please try again later.");
      });
  }, [user, loading, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
        <div className="text-center space-y-4">
          <p className="text-slate-600 text-sm">{error}</p>
          <a href="/login" className="text-orange-500 text-sm font-semibold">
            Sign in instead →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-slate-500 text-sm font-medium">Loading demo…</p>
      </div>
    </div>
  );
}
