// Middleware handles auth-aware routing — authenticated users never reach /,
// unauthenticated users are redirected to /login. This redirect is a fallback
// for cases where middleware is not active (e.g. no Supabase credentials).
import { redirect } from "next/navigation";

export default function RootPage() {
  redirect("/app");
}
