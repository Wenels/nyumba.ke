"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";

const schema = z
  .object({
    newPassword: z.string().min(8, "Minimum 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type Values = z.infer<typeof schema>;

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = use(searchParams);
  const router = useRouter();
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  async function onSubmit(values: Values) {
    if (!token) {
      toast.error("Invalid reset link");
      return;
    }
    try {
      await api.post("/api/password-reset/reset", {
        token,
        newPassword: values.newPassword,
      });
      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? (err.body as { error?: string })?.error
          : "Something went wrong";
      toast.error("Reset failed", { description: message });
    }
  }

  if (!token) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <p className="text-destructive font-semibold">Invalid reset link.</p>
        <Link href="/forgot-password" className="mt-4 text-sm text-secondary hover:underline">
          Request a new one
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle2 className="h-8 w-8 text-primary" />
        </div>
        <h1 className="mt-6 text-2xl font-bold">Password reset!</h1>
        <p className="mt-2 text-muted-foreground">
          Your password has been changed. Redirecting to sign in...
        </p>
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

        <h1 className="text-2xl font-bold tracking-tight">Reset password</h1>
        <p className="mt-1 text-muted-foreground">Enter your new password below.</p>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-8 rounded-xl border border-border bg-card p-8 shadow-sm space-y-5"
        >
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              New password
            </Label>
            <Input
              type="password"
              placeholder="Min 8 characters"
              className="mt-1.5"
              {...register("newPassword")}
            />
            {errors.newPassword && (
              <p className="mt-1 text-xs text-destructive">{errors.newPassword.message}</p>
            )}
          </div>

          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Confirm password
            </Label>
            <Input
              type="password"
              placeholder="Repeat new password"
              className="mt-1.5"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>

          <Button
            type="submit"
            loading={isSubmitting}
            className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
            size="lg"
          >
            {isSubmitting ? "Resetting..." : "Reset password"}
          </Button>
        </form>
      </div>
    </div>
  );
}
