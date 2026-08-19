import { Suspense } from "react";
import { LoginForm } from "@/app/features/auth/components/login-form";

export default function LoginPage() {
  return (
    <div className="flex flex-1 flex-col items-center w-full">
      <Suspense fallback={<div className="h-64 w-full animate-pulse rounded-2xl bg-card" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
