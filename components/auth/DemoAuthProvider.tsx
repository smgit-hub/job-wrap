"use client";

/**
 * DemoAuthProvider
 *
 * Overrides the AuthContext with a fake demo user — no Supabase session,
 * no network calls. Used exclusively by the /demo route.
 */

import { createContext, useContext } from "react";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  isDemo: boolean;
  signOut: () => Promise<void>;
}

// Re-export the same context so useAuth() picks up the demo value
import { AuthContext } from "@/components/auth/AuthProvider";

const MOCK_USER = {
  id: "demo-user",
  email: "demo@jobwrap.app",
  app_metadata: {},
  user_metadata: {},
  aud: "authenticated",
  created_at: "",
} as unknown as User;

export function DemoAuthProvider({ children }: { children: React.ReactNode }) {
  const value: AuthContextValue = {
    user: MOCK_USER,
    session: null,
    loading: false,
    isConfigured: true,
    isDemo: true,
    signOut: async () => {
      // Clear demo localStorage and redirect to landing page
      const { clearDemoSession } = await import("@/lib/db");
      clearDemoSession();
      window.location.href = "/";
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
