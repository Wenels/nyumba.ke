import Link from "next/link";
import { RegisterForm } from "@/app/features/auth/components/register-form";

export default function RegisterPage() {
  return (
    <div className="flex flex-1 flex-col items-center px-6 py-16">
      <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
      <p className="mt-1 text-muted-foreground">Free forever. No agent fees.</p>

      <div className="mt-8 w-full max-w-md">
        <RegisterForm />
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-secondary hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
