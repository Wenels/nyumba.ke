"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/app/features/auth/hooks/use-auth";
import { ApiError } from "@/lib/api";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

type Values = z.infer<typeof schema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, isLoggingIn } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  async function onSubmit(values: Values) {
    try {
      const user = await login(values);
      if (!(user as { isAdmin?: boolean })?.isAdmin) {
        toast.error("Access denied", {
          description: "This account does not have admin privileges.",
        });
        return;
      }
      router.push("/admin/dashboard");
    } catch (err) {
      const message =
        err instanceof ApiError
          ? (err.body as { error?: string })?.error
          : "Invalid credentials";
      toast.error("Login failed", { description: message });
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-foreground px-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/20 mb-4">
            <Shield className="h-7 w-7 text-secondary" />
          </div>
          <h1 className="text-2xl font-bold text-background">Admin login</h1>
          <p className="mt-1 text-sm text-background/50">
            Nyumba.ke administration panel
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="rounded-xl border border-background/10 bg-background/5 p-8 space-y-5"
        >
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-background/50">
              Email
            </Label>
            <Input
              type="email"
              placeholder="admin@nyumba.ke"
              className="mt-1.5 border-background/20 bg-background/10 text-background placeholder:text-background/30 focus-visible:ring-secondary"
              {...register("email")}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-background/50">
              Password
            </Label>
            <Input
              type="password"
              placeholder="••••••••"
              className="mt-1.5 border-background/20 bg-background/10 text-background placeholder:text-background/30 focus-visible:ring-secondary"
              {...register("password")}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isLoggingIn}
            className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
            size="lg"
          >
            {isLoggingIn ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
