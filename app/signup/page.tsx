"use client";

import { useRouter } from "next/navigation";
import SignupForm from "@/components/auth/SignupForm";

export default function SignupPage() {
  const router = useRouter();

  return (
    <SignupForm
      onSuccess={() => router.replace("/")}
      onSignIn={() => router.push("/login")}
    />
  );
}
