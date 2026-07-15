"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  User,
  Mail,
  Phone,
  CreditCard,
  Building2,
  MapPin,
  Lock,
  Pencil,
  KeyRound,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/app/features/auth/hooks/use-auth";
import { api, ApiError } from "@/lib/api";

const profileSchema = z.object({
  fullName: z.string().min(2, "Enter your full name"),
  phone: z.string().optional(),
  idNumber: z.string().optional(),
  businessName: z.string().optional(),
  address: z.string().optional(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: z.string().min(8, "Minimum 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ProfileValues = z.infer<typeof profileSchema>;
type PasswordValues = z.infer<typeof passwordSchema>;

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getFirstName(name: string): string {
  return name.split(" ")[0] || "";
}

function getLastName(name: string): string {
  const parts = name.split(" ");
  return parts.length > 1 ? parts.slice(1).join(" ") : "";
}

export default function ProfilePage() {
  const { user, refetchUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

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
        idNumber: "",
        businessName: "",
        address: "",
      });
    }
  }, [user, resetProfile]);

  async function onProfileSubmit(values: ProfileValues) {
    try {
      await api.patch("/api/auth/profile", values);
      await refetchUser();
      setIsEditing(false);
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
      setShowPasswordModal(false);
      toast.success("Password changed!");
    } catch (err) {
      const message =
        err instanceof ApiError
          ? (err.body as { error?: string })?.error
          : "Something went wrong";
      toast.error("Password change failed", { description: message });
    }
  }

  const verificationStatus = user?.verification || "NOT_VERIFIED";

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Profile Settings
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your landlord account and business details
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setShowPasswordModal(!showPasswordModal)}
          >
            <KeyRound className="h-4 w-4" />
            Change Password
          </Button>
          <Button
            className="gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90"
            onClick={() => setIsEditing(!isEditing)}
          >
            <Pencil className="h-4 w-4" />
            {isEditing ? "Cancel Edit" : "Edit Profile"}
          </Button>
        </div>
      </div>

      {/* Banner card with avatar */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="relative h-36 bg-gradient-to-r from-teal-600 via-emerald-500 to-secondary">
          {/* Avatar centered on the banner */}
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-2xl font-bold shadow-lg ring-4 ring-background">
              {getInitials(user?.fullName || "U")}
            </div>
          </div>
        </div>

        <div className="pt-14 pb-6 text-center">
          <h2 className="text-lg font-bold text-foreground">
            {user?.fullName}
          </h2>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
          <span className="mt-2 inline-block rounded-full bg-secondary/15 px-3 py-1 text-xs font-semibold text-secondary capitalize">
            Property Owner
          </span>
        </div>
      </div>

      {/* Profile form */}
      <form onSubmit={handleProfileSubmit(onProfileSubmit)}>
        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* First Name (locked) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" /> First Name{" "}
                <span className="text-[10px] font-normal text-muted-foreground/60 normal-case">
                  (Locked)
                </span>
              </Label>
              <Input
                value={getFirstName(user?.fullName || "")}
                disabled
                className="bg-muted/40"
              />
              <p className="text-[11px] text-muted-foreground">
                Contact support to update
              </p>
            </div>

            {/* Last Name (locked) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" /> Last Name{" "}
                <span className="text-[10px] font-normal text-muted-foreground/60 normal-case">
                  (Locked)
                </span>
              </Label>
              <Input
                value={getLastName(user?.fullName || "")}
                disabled
                className="bg-muted/40"
              />
              <p className="text-[11px] text-muted-foreground">
                Contact support to update
              </p>
            </div>

            {/* Email (locked) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> Email Address
              </Label>
              <Input
                value={user?.email || ""}
                disabled
                className="bg-muted/40"
              />
              <p className="text-[11px] text-muted-foreground">
                Email cannot be changed
              </p>
            </div>

            {/* Phone (locked) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" /> Phone Number{" "}
                <span className="text-[10px] font-normal text-muted-foreground/60 normal-case">
                  (Locked)
                </span>
              </Label>
              <Input
                placeholder="07XX XXX XXX"
                disabled={!isEditing}
                className={!isEditing ? "bg-muted/40" : ""}
                {...registerProfile("phone")}
              />
              <p className="text-[11px] text-muted-foreground">
                Contact support to update
              </p>
            </div>

            {/* ID Number */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5" /> ID Number
              </Label>
              <Input
                placeholder="e.g. 12345678"
                disabled={!isEditing}
                className={!isEditing ? "bg-muted/40" : ""}
                {...registerProfile("idNumber")}
              />
            </div>

            {/* Business Name (locked) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" /> Business Name (Optional){" "}
                <span className="text-[10px] font-normal text-muted-foreground/60 normal-case">
                  (Locked)
                </span>
              </Label>
              <Input
                placeholder="e.g. Samcy Courts"
                disabled={!isEditing}
                className={!isEditing ? "bg-muted/40" : ""}
                {...registerProfile("businessName")}
              />
              <p className="text-[11px] text-muted-foreground">
                Contact support to update
              </p>
            </div>
          </div>

          {/* Address (full width) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" /> Address (Optional)
            </Label>
            <Input
              placeholder="e.g. 123 Main St, Nairobi"
              disabled={!isEditing}
              className={!isEditing ? "bg-muted/40" : ""}
              {...registerProfile("address")}
            />
          </div>

          {/* Status badges */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Account Status
              </Label>
              <div>
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Active
                </span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Verification Status
              </Label>
              <div>
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                    verificationStatus === "VERIFIED"
                      ? "bg-emerald-100 text-emerald-700"
                      : verificationStatus === "PENDING"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                  }`}
                >
                  {verificationStatus === "VERIFIED"
                    ? "Verified"
                    : verificationStatus === "PENDING"
                      ? "Pending"
                      : "Not Verified"}
                </span>
              </div>
            </div>
          </div>

          {/* Save button (only in edit mode) */}
          {isEditing && (
            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={isProfileSubmitting}
                className="bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2"
              >
                <Lock className="h-4 w-4" />
                {isProfileSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}

          {profileErrors.fullName && (
            <p className="text-xs text-destructive">
              {profileErrors.fullName.message}
            </p>
          )}
        </div>
      </form>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="bg-background rounded-xl shadow-lg w-full max-w-md overflow-hidden flex flex-col border border-border">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">Change Password</h2>
              <p className="text-xs text-muted-foreground mt-1">Update your account password</p>
            </div>
            
            {/* Modal Body */}
            <form onSubmit={handlePasswordSubmit(onPasswordSubmit)}>
              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Current Password
                  </Label>
                  <Input
                    type="password"
                    placeholder="Enter current password"
                    {...registerPassword("currentPassword")}
                  />
                  {passwordErrors.currentPassword && (
                    <p className="text-xs text-destructive mt-1">
                      {passwordErrors.currentPassword.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    New Password
                  </Label>
                  <Input
                    type="password"
                    placeholder="Min 8 characters"
                    {...registerPassword("newPassword")}
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Min 8 chars with uppercase, lowercase, number & special char
                  </p>
                  {passwordErrors.newPassword && (
                    <p className="text-xs text-destructive mt-1">
                      {passwordErrors.newPassword.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Confirm New Password
                  </Label>
                  <Input
                    type="password"
                    placeholder="Confirm new password"
                    {...registerPassword("confirmPassword")}
                  />
                  {passwordErrors.confirmPassword && (
                    <p className="text-xs text-destructive mt-1">
                      {passwordErrors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center gap-3 px-6 py-4 border-t border-border bg-muted/30">
                <Button 
                  type="button"
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowPasswordModal(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={isPasswordSubmitting}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {isPasswordSubmitting ? "Changing..." : "Change Password"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
