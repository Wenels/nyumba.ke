import Link from "next/link";
import { LoginForm } from "@/app/features/auth/components/login-form";

export default function LoginPage() {
  return (
    <div className="flex flex-1 flex-col items-center px-6 py-16">
      <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
      <p className="mt-1 text-muted-foreground">Sign in to your account</p>

      <div className="mt-8 w-full max-w-md">
        <LoginForm />
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-medium text-secondary hover:underline"
        >
          Create one free
        </Link>
      </p>
    </div>
  );
}
