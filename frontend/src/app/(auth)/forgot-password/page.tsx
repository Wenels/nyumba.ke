"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Mail, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
});

type Values = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  async function onSubmit(values: Values) {
    try {
      await api.post("/api/password-reset/request", values);
      setSubmitted(true);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? (err.body as { error?: string })?.error
          : "Something went wrong";
      toast.error("Request failed", { description: message });
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-8 w-8 text-primary" />
        </div>
        <h1 className="mt-6 text-2xl font-bold">Check your email</h1>
        <p className="mt-2 max-w-sm text-muted-foreground">
          If an account exists for that email, we've sent a password reset link.
          Check your inbox and spam folder.
        </p>
        <Link
          href="/login"
          className="mt-6 flex items-center gap-2 text-sm text-secondary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <Link
          href="/login"
          className="mb-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>

        <h1 className="text-2xl font-bold tracking-tight">Forgot password?</h1>
        <p className="mt-1 text-muted-foreground">
          Enter your email and we'll send you a reset link.
        </p>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-8 rounded-xl border border-border bg-card p-8 shadow-sm space-y-5"
        >
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Email address
            </Label>
            <Input
              type="email"
              placeholder="you@example.com"
              className="mt-1.5"
              {...register("email")}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <Button
            type="submit"
            loading={isSubmitting}
            className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
            size="lg"
          >
            {isSubmitting ? "Sending..." : "Send reset link"}
          </Button>
        </form>
      </div>
    </div>
  );
}
