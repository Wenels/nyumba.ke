"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { UserCircle, Camera } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/app/features/auth/hooks/use-auth";
import { api, ApiError } from "@/lib/api";

const profileSchema = z.object({
  fullName: z.string().min(2, "Enter your full name"),
  phone: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Enter your current password"),
  newPassword: z.string().min(8, "Minimum 8 characters"),
  confirmPassword: z.string().min(1, "Confirm your new password"),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ProfileValues = z.infer<typeof profileSchema>;
type PasswordValues = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const { user, refetchUser } = useAuth();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    reset: resetProfile,
    formState: { errors: profileErrors, isSubmitting: isProfileSubmitting },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting },
  } = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    if (user) {
      resetProfile({
        fullName: user.fullName,
        phone: user.phone ?? "",
      });
    }
  }, [user, resetProfile]);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function onProfileSubmit(values: ProfileValues) {
    try {
      await api.patch("/api/auth/profile", values);
      await refetchUser();
      toast.success("Profile updated!");
    } catch (err) {
      const message =
        err instanceof ApiError
          ? (err.body as { error?: string })?.error
          : "Something went wrong";
      toast.error("Update failed", { description: message });
    }
  }

  async function onPasswordSubmit(values: PasswordValues) {
    try {
      await api.patch("/api/auth/password", {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      resetPassword();
      toast.success("Password changed!");
    } catch (err) {
      const message =
        err instanceof ApiError
          ? (err.body as { error?: string })?.error
          : "Something went wrong";
      toast.error("Password change failed", { description: message });
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your account details and password.
        </p>
      </div>

      {/* Avatar */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-semibold">Profile photo</h2>
        <div className="mt-4 flex items-center gap-6">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted overflow-hidden">
              {avatarPreview || user?.avatarUrl ? (
                <img
                  src={avatarPreview || user?.avatarUrl || ""}
                  alt="Avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <UserCircle className="h-12 w-12 text-muted-foreground" />
              )}
            </div>
            <label className="absolute bottom-0 right-0 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/90">
              <Camera className="h-3.5 w-3.5" />
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </label>
          </div>
          <div>
            <p className="text-sm font-medium">{user?.fullName}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Avatar upload coming soon
            </p>
          </div>
        </div>
      </div>

      {/* Profile info */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-semibold">Personal information</h2>
        <form
          onSubmit={handleProfileSubmit(onProfileSubmit)}
          className="mt-5 space-y-5"
        >
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Full name
            </Label>
            <Input className="mt-1.5" {...registerProfile("fullName")} />
            {profileErrors.fullName && (
              <p className="mt-1 text-xs text-destructive">
                {profileErrors.fullName.message}
              </p>
            )}
          </div>

          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Email address
            </Label>
            <Input
              value={user?.email ?? ""}
              disabled
              className="mt-1.5 opacity-60"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Email cannot be changed.
            </p>
          </div>

          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Phone number
            </Label>
            <Input
              placeholder="07XX XXX XXX"
              className="mt-1.5"
              {...registerProfile("phone")}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Displayed to tenants on your listings so they can call directly.
            </p>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isProfileSubmitting}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
            >
              {isProfileSubmitting ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
      </div>

      {/* Change password */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-semibold">Change password</h2>
        <form
          onSubmit={handlePasswordSubmit(onPasswordSubmit)}
          className="mt-5 space-y-5"
        >
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Current password
            </Label>
            <Input
              type="password"
              className="mt-1.5"
              {...registerPassword("currentPassword")}
            />
            {passwordErrors.currentPassword && (
              <p className="mt-1 text-xs text-destructive">
                {passwordErrors.currentPassword.message}
              </p>
            )}
          </div>

          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              New password
            </Label>
            <Input
              type="password"
              className="mt-1.5"
              {...registerPassword("newPassword")}
            />
            {passwordErrors.newPassword && (
              <p className="mt-1 text-xs text-destructive">
                {passwordErrors.newPassword.message}
              </p>
            )}
          </div>

          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Confirm new password
            </Label>
            <Input
              type="password"
              className="mt-1.5"
              {...registerPassword("confirmPassword")}
            />
            {passwordErrors.confirmPassword && (
              <p className="mt-1 text-xs text-destructive">
                {passwordErrors.confirmPassword.message}
              </p>
            )}
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isPasswordSubmitting}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
            >
              {isPasswordSubmitting ? "Changing..." : "Change password"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
