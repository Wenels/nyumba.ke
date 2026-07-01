"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Search } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useAuth } from "@/app/features/auth/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api";

const registerSchema = z.object({
  role: z.enum(["TENANT", "LANDLORD"]),
  fullName: z.string().min(2, "Enter your full name"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().optional(),
  password: z.string().min(8, "Minimum 8 characters"),
});

type RegisterValues = z.infer<typeof registerSchema>;

const ROLE_OPTIONS = [
  {
    value: "TENANT" as const,
    icon: Search,
    title: "Tenant",
    description: "I'm looking for a home",
  },
  {
    value: "LANDLORD" as const,
    icon: Building2,
    title: "Landlord",
    description: "I have a house to rent",
  },
];

export function RegisterForm() {
  const { register: registerUser, isRegistering } = useAuth();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "TENANT" },
  });

  const selectedRole = watch("role");

  async function onSubmit(values: RegisterValues) {
    try {
      await registerUser({
        email: values.email,
        password: values.password,
        fullName: values.fullName,
        role: values.role,
      });

      toast.success("Account created!", {
        description: "Welcome to Nyumba.ke. You're now logged in.",
      });
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body as { error?: string | { formErrors?: string[] } };
        const message =
          typeof body?.error === "string"
            ? body.error
            : (body?.error?.formErrors?.[0] ??
              "Something went wrong. Please try again.");
        toast.error("Registration failed", { description: message });
      } else {
        toast.error("Could not reach the server", {
          description: "Is the backend running?",
        });
      }
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="rounded-xl border border-border bg-card p-8 shadow-sm"
    >
      <div>
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          I am a...
        </Label>
        <div className="mt-2 grid grid-cols-2 gap-3">
          {ROLE_OPTIONS.map(({ value, icon: Icon, title, description }) => {
            const active = selectedRole === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setValue("role", value)}
                className={`flex flex-col items-center gap-1 rounded-lg border px-3 py-4 text-center transition-colors ${
                  active
                    ? "border-secondary bg-secondary/10"
                    : "border-border hover:border-secondary/50"
                }`}
              >
                <Icon
                  className={`h-5 w-5 ${active ? "text-secondary" : "text-muted-foreground"}`}
                />
                <span
                  className={`text-sm font-semibold ${active ? "text-secondary" : ""}`}
                >
                  {title}
                </span>
                <span className="text-xs text-muted-foreground">
                  {description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 space-y-5">
        <div>
          <Label
            htmlFor="fullName"
            className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          >
            Full name
          </Label>
          <Input
            id="fullName"
            placeholder="Jane Wanjiku"
            className="mt-1.5"
            {...register("fullName")}
          />
          {errors.fullName && (
            <p className="mt-1 text-xs text-destructive">
              {errors.fullName.message}
            </p>
          )}
        </div>

        <div>
          <Label
            htmlFor="email"
            className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          >
            Email address
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            className="mt-1.5"
            {...register("email")}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-destructive">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <Label
            htmlFor="phone"
            className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          >
            Phone number (optional)
          </Label>
          <Input
            id="phone"
            placeholder="07XX XXX XXX"
            className="mt-1.5"
            {...register("phone")}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Displayed to tenants contacting you
          </p>
        </div>

        <div>
          <Label
            htmlFor="password"
            className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          >
            Password
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="Min 8 characters"
            className="mt-1.5"
            {...register("password")}
          />
          {errors.password && (
            <p className="mt-1 text-xs text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>
      </div>

      <Button
        type="submit"
        disabled={isRegistering}
        className="mt-6 w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
        size="lg"
      >
        {isRegistering ? "Creating account..." : "Create account — it's free"}
      </Button>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        By registering you agree to our Terms and Privacy Policy.
      </p>
    </form>
  );
}
