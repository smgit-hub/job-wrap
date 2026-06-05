// ---------------------------------------------------------------------------
// JobWrap — Auth Middleware (Layer 2 of 2)
//
// ── Access control architecture ──────────────────────────────────────────────
//
// Layer 1 — AppGild licence snippet (app/layout.tsx, Step 5 of upload wizard)
//   • Gates the ENTIRE app behind a valid AppGild licence key
//   • No public routes — no whitelist, no exceptions
//   • /demo, /privacy, /terms are all behind the licence gate
//   • The AppGild reviewer uses their private bypass to access /demo
//   • Buyers access the app via My Purchases → Open after subscribing
//   • DO NOT add public route exclusions expecting them to work — the
//     AppGild snippet runs before anything else and blocks unlicensed visitors
//
// Layer 2 — This file (Supabase session auth)
//   • Runs AFTER the AppGild snippet confirms a valid licence
//   • Checks the user has a JobWrap account and is signed in
//   • Redirects unauthenticated users to /login
//   • Redirects authenticated users away from /login and /signup
//
// ── What is excluded from this middleware ────────────────────────────────────
//
// The matcher below excludes routes that must bypass THIS layer only:
//   _next/static, _next/image  — Next.js internals (must always be reachable)
//   favicon.ico, manifest.json, icons/  — PWA assets
//   api/  — API routes handle their own Supabase auth (Bearer token + cookie)
//
// Note: /r/, /demo, /privacy, /terms are listed in the matcher exclusion only
// as a legacy remnant. They are all gated by the AppGild snippet at Layer 1.
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Passthrough: auth bypass enabled for local dev only.
  // SAFETY: throw at runtime if someone accidentally sets BYPASS_AUTH=true in
  // production — this is a misconfiguration that would expose all routes.
  if (process.env.BYPASS_AUTH === "true") {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "[middleware] BYPASS_AUTH=true is not allowed in production. " +
        "Remove it from your environment variables and redeploy."
      );
    }
    console.warn("[middleware] BYPASS_AUTH=true — all auth checks skipped. Dev only.");
    return NextResponse.next();
  }

  if (!url || !key) {
    return NextResponse.next();
  }

  const response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // Refresh the session so it doesn't expire silently
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/signup");

  // Redirect unauthenticated users to /login (except on auth routes)
  if (!user && !isAuthRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect authenticated users away from /login and /signup
  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL("/app", request.url));
  }

  return response;
}

export const config = {
  // Excludes Next.js internals, PWA assets, and API routes (which auth themselves).
  // All other routes pass through this middleware for Supabase session checks.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|icons/|api/|r/|privacy|terms|demo).*)"],
};
