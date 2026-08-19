"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Search, Eye, EyeOff, ShieldAlert, User, Mail, Phone, Lock, Building } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useAuth } from "@/app/features/auth/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api";
import Image from "next/image";
import Link from "next/link";

const registerSchema = z
  .object({
    role: z.enum(["TENANT", "LANDLORD"]),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Enter a valid email address"),
    phone: z.string().optional(),
    businessName: z.string().optional(),
    businessRegNo: z.string().optional(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine(
    (data) => {
      if (data.role === "LANDLORD") {
        return !!data.businessName && data.businessName.trim().length > 0;
      }
      return true;
    },
    {
      message: "Business / Property Name is required",
      path: ["businessName"],
    }
  );

type RegisterValues = z.infer<typeof registerSchema>;

const ROLE_OPTIONS = [
  {
    value: "TENANT" as const,
    icon: Search,
    title: "Tenant",
    description: "Looking for a house to rent",
  },
  {
    value: "LANDLORD" as const,
    icon: Building2,
    title: "Landlord",
    description: "Have houses to list & manage",
  },
];

export function RegisterFormContent() {
  const searchParams = useSearchParams();
  const initialRoleParam = searchParams.get("role")?.toUpperCase();
  const initialRole = initialRoleParam === "LANDLORD" ? "LANDLORD" : "TENANT";

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register: registerUser, isRegistering } = useAuth();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: initialRole,
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      businessName: "",
      businessRegNo: "",
      password: "",
      confirmPassword: "",
    },
  });

  const selectedRole = watch("role");

  useEffect(() => {
    if (initialRoleParam === "LANDLORD" || initialRoleParam === "TENANT") {
      setValue("role", initialRoleParam as "LANDLORD" | "TENANT");
    }
  }, [initialRoleParam, setValue]);

  async function onSubmit(values: RegisterValues) {
    try {
      const fullName = `${values.firstName.trim()} ${values.lastName.trim()}`.trim();

      await registerUser({
        email: values.email,
        password: values.password,
        fullName,
        role: values.role,
        phone: values.phone,
      });

      toast.success("Account created successfully!", {
        description: `Welcome to Nyumba.ke! You are registered as a ${values.role === "LANDLORD" ? "Landlord" : "Tenant"}.`,
      });
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body as { error?: string | { formErrors?: string[] } };
        const message =
          typeof body?.error === "string"
            ? body.error
            : body?.error?.formErrors?.[0] ??
              "Registration failed. Please check your details and try again.";
        toast.error("Registration failed", { description: message });
      } else {
        toast.error("Could not reach the server", {
          description: "Is the backend running?",
        });
      }
    }
  }

  return (
    <div className="w-full rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-2xl space-y-6">
      {/* Header with Logo */}
      <div className="text-center space-y-2">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/15 p-2 border border-secondary/20 shadow-xs">
          <Image
            src="/logo.svg"
            alt="Nyumba.ke Logo"
            width={40}
            height={40}
            className="object-contain"
          />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Create Account
        </h1>
        <p className="text-xs font-medium text-muted-foreground">
          {selectedRole === "LANDLORD"
            ? "Register as a Landlord to list and manage properties"
            : "Find your perfect home today."}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Hidden role input initialized by URL / page */}
        <input type="hidden" {...register("role")} />

        {/* First & Last Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label
              htmlFor="firstName"
              className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1"
            >
              <User className="h-3.5 w-3.5" /> First Name
            </Label>
            <Input
              id="firstName"
              placeholder="First Name"
              className="mt-1 h-9 text-xs"
              {...register("firstName")}
            />
            {errors.firstName && (
              <p className="mt-1 text-[11px] text-destructive">
                {errors.firstName.message}
              </p>
            )}
          </div>
          <div>
            <Label
              htmlFor="lastName"
              className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1"
            >
              <User className="h-3.5 w-3.5" /> Last Name
            </Label>
            <Input
              id="lastName"
              placeholder="Last Name"
              className="mt-1 h-9 text-xs"
              {...register("lastName")}
            />
            {errors.lastName && (
              <p className="mt-1 text-[11px] text-destructive">
                {errors.lastName.message}
              </p>
            )}
          </div>
        </div>

        {/* Email Address */}
        <div>
          <Label
            htmlFor="email"
            className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1"
          >
            <Mail className="h-3.5 w-3.5" /> Email Address
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            className="mt-1 h-9 text-xs"
            {...register("email")}
          />
          {errors.email && (
            <p className="mt-1 text-[11px] text-destructive">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Phone Number */}
        <div>
          <Label
            htmlFor="phone"
            className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1"
          >
            <Phone className="h-3.5 w-3.5" /> Phone Number (+254...)
          </Label>
          <Input
            id="phone"
            placeholder="0712 345 678"
            className="mt-1 h-9 text-xs"
            {...register("phone")}
          />
        </div>

        {/* Landlord Specific Fields */}
        {selectedRole === "LANDLORD" && (
          <div className="space-y-3 pt-1 border-t border-border">
            <div>
              <Label
                htmlFor="businessName"
                className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1"
              >
                <Building className="h-3.5 w-3.5" /> Business / Property Name *
              </Label>
              <Input
                id="businessName"
                placeholder="E.g., Westlands Heights Ltd"
                className="mt-1 h-9 text-xs"
                {...register("businessName")}
              />
              {errors.businessName && (
                <p className="mt-1 text-[11px] text-destructive">
                  {errors.businessName.message}
                </p>
              )}
            </div>

            <div>
              <Label
                htmlFor="businessRegNo"
                className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1"
              >
                <Building className="h-3.5 w-3.5" /> Business Registration No. (Optional)
              </Label>
              <Input
                id="businessRegNo"
                placeholder="E.g., CPR/2023/12345"
                className="mt-1 h-9 text-xs"
                {...register("businessRegNo")}
              />
            </div>

            {/* Landlord Admin Approval Warning Banner */}
            <div className="rounded-xl border border-amber-300/60 bg-amber-500/10 p-3 flex items-start gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-900 font-medium leading-normal">
                Your landlord account will undergo <strong>admin verification</strong> before your property listings are published live.
              </p>
            </div>
          </div>
        )}

        {/* Password & Confirm Password */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label
              htmlFor="password"
              className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1"
            >
              <Lock className="h-3.5 w-3.5" /> Password
            </Label>
            <div className="relative mt-1">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Min 8 chars"
                className="h-9 text-xs pr-9"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-[11px] text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          <div>
            <Label
              htmlFor="confirmPassword"
              className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1"
            >
              <Lock className="h-3.5 w-3.5" /> Confirm Password
            </Label>
            <div className="relative mt-1">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter"
                className="h-9 text-xs pr-9"
                {...register("confirmPassword")}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-[11px] text-destructive">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
        </div>

        <Button
          type="submit"
          loading={isRegistering}
          className="mt-4 w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 h-10 font-bold text-xs shadow-md"
        >
          {isRegistering
            ? "Creating Account..."
            : selectedRole === "LANDLORD"
            ? "Register as Landlord →"
            : "Create Account"}
        </Button>
      </form>

      {/* Footer Link */}
      <p className="text-center text-xs text-muted-foreground pt-1 border-t border-border">
        Already have an account?{" "}
        <Link
          href={`/login${selectedRole === "LANDLORD" ? "?role=LANDLORD" : ""}`}
          className="font-bold text-secondary hover:underline"
        >
          Sign In
        </Link>
      </p>
    </div>
  );
}

export function RegisterForm() {
  return <RegisterFormContent />;
}
