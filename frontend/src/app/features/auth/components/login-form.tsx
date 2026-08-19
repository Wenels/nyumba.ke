"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Eye, EyeOff, Mail, Lock, Building2, UserCheck } from "lucide-react";
import { useAuth } from "@/app/features/auth/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api";
import Image from "next/image";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginFormContent() {
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role")?.toUpperCase();
  const isLandlord = roleParam === "LANDLORD";

  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoggingIn } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginValues) {
    try {
      const redirectUrl = searchParams.get("redirect");
      await login({
        ...values,
        expectedRole: isLandlord ? "LANDLORD" : "TENANT",
        redirectTo: redirectUrl || undefined,
      });
      toast.success("Welcome back!", {
        description: "You've signed in successfully.",
      });
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body as { error?: string };
        toast.error("Sign-in failed", {
          description: body?.error || "Invalid email or password.",
        });
      } else {
        toast.error("Could not reach the server", {
          description: "Is the backend running?",
        });
      }
    }
  }

  return (
    <div className="w-full rounded-3xl border border-border bg-card p-7 sm:p-9 shadow-2xl space-y-6">
      {/* Header with Logo & Role Subtitle */}
      <div className="text-center space-y-2">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/15 p-2.5 border border-secondary/20 shadow-xs">
          <Image
            src="/logo.svg"
            alt="Nyumba.ke Logo"
            width={44}
            height={44}
            className="object-contain"
          />
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Welcome to Nyumba.ke
        </h1>

        <div className="inline-flex items-center gap-1.5 rounded-full bg-secondary/10 px-3 py-1 text-xs font-bold text-secondary border border-secondary/20">
          {isLandlord ? (
            <>
              <Building2 className="h-3.5 w-3.5" /> Sign in to your Landlord Account
            </>
          ) : (
            <>
              <UserCheck className="h-3.5 w-3.5" /> Sign in with your email or username
            </>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label
            htmlFor="email"
            className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1"
          >
            <Mail className="h-3.5 w-3.5" /> Email Address or Username
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            className="mt-1.5 h-10 text-sm"
            {...register("email")}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-destructive">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <Label
              htmlFor="password"
              className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1"
            >
              <Lock className="h-3.5 w-3.5" /> Password
            </Label>
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-secondary hover:underline"
            >
              Forgot Password?
            </Link>
          </div>
          <div className="relative mt-1.5">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className="h-10 text-sm pr-10"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-xs text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          loading={isLoggingIn}
          className="mt-6 w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 h-11 font-bold text-sm shadow-md"
        >
          {isLoggingIn ? "Signing in..." : "LOG IN →"}
        </Button>
      </form>

      {/* Footer Link */}
      <p className="text-center text-xs text-muted-foreground pt-2 border-t border-border">
        Don&apos;t have an account?{" "}
        <Link
          href={`/register${isLandlord ? "?role=LANDLORD" : ""}`}
          className="font-bold text-secondary hover:underline"
        >
          Register
        </Link>
      </p>
    </div>
  );
}

export function LoginForm() {
  return <LoginFormContent />;
}
