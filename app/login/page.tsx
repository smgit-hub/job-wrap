"use client";

import { useRouter } from "next/navigation";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  const router = useRouter();

  return (
    <LoginForm
      onSuccess={() => router.replace("/")}
      onSignUp={() => router.push("/signup")}
    />
  );
}
