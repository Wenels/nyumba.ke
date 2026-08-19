import { Suspense } from "react";
import { RegisterForm } from "@/app/features/auth/components/register-form";

export default function RegisterPage() {
  return (
    <div className="flex flex-1 flex-col items-center w-full">
      <Suspense fallback={<div className="h-96 w-full animate-pulse rounded-2xl bg-card" />}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
