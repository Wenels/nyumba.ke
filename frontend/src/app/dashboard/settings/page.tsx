"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Globe, DollarSign, ShieldCheck, Bell, Save, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/app/features/auth/hooks/use-auth";
import { api, ApiError } from "@/lib/api";

const TABS = [
  { id: "general", label: "General", icon: Globe },
  { id: "mpesa", label: "M-Pesa Payments", icon: DollarSign },
  { id: "security", label: "Security", icon: ShieldCheck },
  { id: "notifications", label: "Notifications", icon: Bell },
];

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "Minimum 8 characters"),
  confirmPassword: z.string().min(1),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type PasswordValues = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [mpesaNumber, setMpesaNumber] = useState("");
  const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false });
  const [notifications, setNotifications] = useState({
    inApp: true,
    email: true,
    payment: true,
  });
  const { user, refetchUser } = useAuth();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
  });

  async function onPasswordSubmit(values: PasswordValues) {
    try {
      await api.patch("/api/auth/password", {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      reset();
      toast.success("Password changed!");
    } catch (err) {
      const message = err instanceof ApiError ? (err.body as any)?.error : "Something went wrong";
      toast.error("Failed", { description: message });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <div className="flex gap-6 flex-col lg:flex-row">
        {/* Tab sidebar */}
        <div className="w-full lg:w-48 shrink-0">
          <nav className="space-y-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                }`}>
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab content */}
        <div className="flex-1 rounded-xl border border-border bg-card p-6">
          {/* General */}
          {activeTab === "general" && (
            <div className="space-y-5">
              <h2 className="font-semibold">General Settings</h2>
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Theme</Label>
                <select className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option>Light</option>
                  <option>Dark</option>
                  <option>System</option>
                </select>
              </div>
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Language</Label>
                <select className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option>English</option>
                  <option>Swahili</option>
                </select>
              </div>
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Timezone</Label>
                <select className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option>East Africa Time (EAT)</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Enable Notifications</p>
                  <p className="text-xs text-muted-foreground">Receive in-app notifications</p>
                </div>
                <button onClick={() => setNotifications((n) => ({ ...n, inApp: !n.inApp }))}
                  className={`relative h-6 w-11 rounded-full transition-colors ${notifications.inApp ? "bg-primary" : "bg-muted"}`}>
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${notifications.inApp ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>
              <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2">
                <Save className="h-4 w-4" /> Save Changes
              </Button>
            </div>
          )}

          {/* M-Pesa */}
          {activeTab === "mpesa" && (
            <div className="space-y-5">
              <h2 className="font-semibold">M-Pesa Payment Settings</h2>
              <p className="text-sm text-muted-foreground">Configure your M-Pesa number to receive automatic payments from tenants</p>

              {!mpesaNumber ? (
                <div className="rounded-lg border border-secondary/30 bg-secondary/5 p-4">
                  <p className="font-semibold text-sm text-secondary">No M-Pesa Number Added</p>
                  <p className="mt-1 text-xs text-muted-foreground">Add your M-Pesa number to start receiving automatic payments from tenants</p>
                </div>
              ) : (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <p className="font-semibold text-sm text-primary">M-Pesa Number: {mpesaNumber}</p>
                </div>
              )}

              <div>
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Add M-Pesa Number</Label>
                <div className="mt-1.5 flex gap-2">
                  <Input value={mpesaNumber} onChange={(e) => setMpesaNumber(e.target.value)}
                    placeholder="0712345678 or 254712345678" className="flex-1" />
                  <Button onClick={() => toast.success("M-Pesa number saved!")}
                    className="bg-primary text-primary-foreground hover:bg-primary/90">Add</Button>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Accepted formats: 0712345678, 254712345678, +254712345678</p>
              </div>

              <div className="rounded-lg border border-border p-4">
                <p className="font-semibold text-sm mb-3">How it works:</p>
                <ol className="space-y-2 text-sm text-muted-foreground">
                  {[
                    "Add your M-Pesa phone number",
                    "Verify it (you'll receive KES 1 as confirmation)",
                    "Enable automatic disbursement",
                    "Receive payments instantly when tenants pay (95% after 5% platform fee)",
                  ].map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{i + 1}</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}

          {/* Security */}
          {activeTab === "security" && (
            <div className="space-y-5">
              <h2 className="font-semibold">Security Settings</h2>

              {/* Account info */}
              <div className="rounded-lg border border-border p-4 space-y-3">
                <p className="font-semibold text-sm">Account Information</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <span className="w-20 shrink-0 text-xs font-medium uppercase tracking-wide">Name</span>
                    <span className="font-medium text-foreground">{user?.fullName}</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <span className="w-20 shrink-0 text-xs font-medium uppercase tracking-wide">Email</span>
                    <span className="font-medium text-foreground">{user?.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <span className="w-20 shrink-0 text-xs font-medium uppercase tracking-wide">Phone</span>
                    <span className="font-medium text-foreground">{user?.phone ?? "Not set"}</span>
                  </div>
                </div>
              </div>

              {/* Change password */}
              <div>
                <p className="font-semibold text-sm mb-4">Change Password</p>
                <form onSubmit={handleSubmit(onPasswordSubmit)} className="space-y-4">
                  {(["currentPassword", "newPassword", "confirmPassword"] as const).map((field) => (
                    <div key={field}>
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {field === "currentPassword" ? "Current Password" : field === "newPassword" ? "New Password" : "Confirm New Password"}
                      </Label>
                      <div className="relative mt-1.5">
                        <Input type={showPassword[field === "currentPassword" ? "current" : field === "newPassword" ? "new" : "confirm"] ? "text" : "password"}
                          {...register(field)} className="pr-10" />
                        <button type="button"
                          onClick={() => setShowPassword((s) => ({
                            ...s,
                            [field === "currentPassword" ? "current" : field === "newPassword" ? "new" : "confirm"]:
                              !s[field === "currentPassword" ? "current" : field === "newPassword" ? "new" : "confirm"]
                          }))}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          {showPassword[field === "currentPassword" ? "current" : field === "newPassword" ? "new" : "confirm"] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {errors[field] && <p className="mt-1 text-xs text-destructive">{errors[field]?.message}</p>}
                    </div>
                  ))}
                  <Button type="submit" loading={isSubmitting}
                    className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                    {!isSubmitting && <ShieldCheck className="h-4 w-4" />}
                    {isSubmitting ? "Changing..." : "Change Password"}
                  </Button>
                </form>
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeTab === "notifications" && (
            <div className="space-y-5">
              <h2 className="font-semibold">Notification Preferences</h2>
              <p className="text-sm text-muted-foreground">Choose how you want to be notified about important events</p>

              {[
                { key: "inApp" as const, label: "In-App Notifications", desc: "Receive notifications within the dashboard" },
                { key: "email" as const, label: "Email Notifications", desc: "Receive important updates via email" },
                { key: "payment" as const, label: "Payment Notifications", desc: "Get notified when payments are sent to your M-Pesa" },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <p className="font-medium text-sm">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                  <button onClick={() => setNotifications((n) => ({ ...n, [key]: !n[key] }))}
                    className={`relative h-6 w-11 rounded-full transition-colors ${notifications[key] ? "bg-primary" : "bg-muted"}`}>
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${notifications[key] ? "translate-x-5" : "translate-x-0.5"}`} />
                  </button>
                </div>
              ))}

              <Button onClick={() => toast.success("Notification preferences saved!")}
                className="gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90">
                <Save className="h-4 w-4" /> Save Changes
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
