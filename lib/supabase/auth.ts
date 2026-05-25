// ---------------------------------------------------------------------------
// Auth helpers — thin wrappers over the Supabase auth API
//
// All functions return null / false / empty when Supabase is not configured,
// so the app continues to work in localStorage-only mode.
//
// TODO (future): add magic link / OAuth (Google) sign-in options
// TODO (future): add password reset flow
// TODO (future): add team / multi-user support via Supabase organization features
// ---------------------------------------------------------------------------

import { getSupabaseBrowserClient } from "./client";
import type { User, Session, AuthError } from "@supabase/supabase-js";

export interface AuthResult {
  user: User | null;
  session: Session | null;
  error: AuthError | null;
}

export async function signInWithPassword(
  email: string,
  password: string
): Promise<AuthResult> {
  const client = getSupabaseBrowserClient();
  if (!client) {
    return { user: null, session: null, error: null };
  }

  const { data, error } = await client.auth.signInWithPassword({ email, password });
  return {
    user: data.user ?? null,
    session: data.session ?? null,
    error,
  };
}

export async function signUp(
  email: string,
  password: string
): Promise<AuthResult> {
  const client = getSupabaseBrowserClient();
  if (!client) {
    return { user: null, session: null, error: null };
  }

  const { data, error } = await client.auth.signUp({ email, password });
  return {
    user: data.user ?? null,
    session: data.session ?? null,
    error,
  };
}

export async function signOut(): Promise<{ error: AuthError | null }> {
  const client = getSupabaseBrowserClient();
  if (!client) return { error: null };

  const { error } = await client.auth.signOut();
  return { error };
}

export async function getSession(): Promise<Session | null> {
  const client = getSupabaseBrowserClient();
  if (!client) return null;

  const { data } = await client.auth.getSession();
  return data.session;
}

export async function getUser(): Promise<User | null> {
  const client = getSupabaseBrowserClient();
  if (!client) return null;

  const { data } = await client.auth.getUser();
  return data.user ?? null;
}
