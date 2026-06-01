"use client";

import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { signOut as authSignOut } from "@/lib/supabase/auth";
import { clearDemoSession } from "@/lib/db";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  isDemo: boolean;
  signOut: () => Promise<void>;
}

export const DEMO_EMAIL = "demo@jobwrap.app";

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  loading: true,
  isConfigured: false,
  isDemo: false,
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const configured = isSupabaseConfigured();
  const userRef = useRef<User | null>(null);

  useEffect(() => {
    if (!configured) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }

    const client = getSupabaseBrowserClient();
    if (!client) {
      setLoading(false);
      return;
    }

    // Load the initial session
    client.auth.getSession().then(({ data }) => {
      userRef.current = data.session?.user ?? null;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    // Subscribe to auth state changes (login, logout, token refresh)
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, newSession) => {
      const newUser = newSession?.user ?? null;
      // If a real (non-demo) user just signed in and the previous session was
      // demo, clear localStorage so demo data can't migrate into their account.
      if (newUser && newUser.email !== DEMO_EMAIL && userRef.current?.email === DEMO_EMAIL) {
        clearDemoSession();
      }
      userRef.current = newUser;
      setSession(newSession);
      setUser(newUser);
    });

    return () => subscription.unsubscribe();
  }, [configured]);

  const signOut = useCallback(async () => {
    await authSignOut();
    setUser(null);
    setSession(null);
  }, []);

  const isDemo = user?.email === DEMO_EMAIL;

  return (
    <AuthContext.Provider value={{ user, session, loading, isConfigured: configured, isDemo, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
