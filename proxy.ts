import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Auth proxy — only active when Supabase credentials are configured.
// Without NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY the app
// runs in localStorage-only mode and no redirect occurs.

export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Passthrough: Supabase not configured, or auth bypass enabled for local dev
  if (process.env.BYPASS_AUTH === "true") {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[proxy] BYPASS_AUTH=true — all auth checks skipped. Never set this in production.");
    }
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
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  // Run on all routes except static assets and API routes
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|api/).*)"],
};
