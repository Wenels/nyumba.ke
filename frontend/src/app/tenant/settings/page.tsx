"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Globe, ShieldCheck, Bell, Save, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/app/features/auth/hooks/use-auth";
import { api, ApiError } from "@/lib/api";

const TABS = [
  { id: "general", label: "General", icon: Globe },
  { id: "security", label: "Security", icon: ShieldCheck },
  { id: "notifications", label: "Notifications", icon: Bell },
];

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Required"),
  newPassword: z.string().min(8, "Minimum 8 characters"),
  confirmPassword: z.string().min(1, "Required"),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type PasswordValues = z.infer<typeof passwordSchema>;

export default function TenantSettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
  const [notifications, setNotifications] = useState({
    inApp: true,
    email: true,
    messages: true,
    propertyUpdates: true,
    contractUpdates: true,
    systemAlerts: true,
  });
  const { user } = useAuth();

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

  const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
    <button onClick={onChange}
      className={`relative h-6 w-11 rounded-full transition-colors ${value ? "bg-primary" : "bg-muted"}`}>
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${value ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <div className="flex gap-6 flex-col lg:flex-row">
        {/* Tab sidebar */}
        <div className="w-full lg:w-44 shrink-0">
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

        {/* Content */}
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
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <p className="text-sm font-medium">Enable Notifications</p>
                  <p className="text-xs text-muted-foreground">Receive in-app notifications for bookings, messages, and updates</p>
                </div>
                <Toggle value={notifications.inApp} onChange={() => setNotifications((n) => ({ ...n, inApp: !n.inApp }))} />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <p className="text-sm font-medium">Email Notifications</p>
                  <p className="text-xs text-muted-foreground">Receive important updates and alerts via email</p>
                </div>
                <Toggle value={notifications.email} onChange={() => setNotifications((n) => ({ ...n, email: !n.email }))} />
              </div>
              <Button onClick={() => toast.success("Settings saved!")}
                className="gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90">
                <Save className="h-4 w-4" /> Save Changes
              </Button>
            </div>
          )}

          {/* Security */}
          {activeTab === "security" && (
            <div className="space-y-5">
              <h2 className="font-semibold">Security Settings</h2>
              <div className="rounded-lg border border-border p-4 space-y-3">
                <p className="font-semibold text-sm">Account Information</p>
                {[
                  { label: "Full Name", value: user?.fullName },
                  { label: "Email", value: user?.email },
                  { label: "Phone", value: user?.phone ?? "Not set" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center gap-3 text-sm">
                    <span className="w-20 shrink-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
                    <span>{value}</span>
                  </div>
                ))}
              </div>

              <div>
                <p className="font-semibold text-sm mb-4">Change Password</p>
                <form onSubmit={handleSubmit(onPasswordSubmit)} className="space-y-4">
                  {([
                    { field: "currentPassword" as const, label: "Current Password", key: "current" as const },
                    { field: "newPassword" as const, label: "New Password", key: "new" as const },
                    { field: "confirmPassword" as const, label: "Confirm New Password", key: "confirm" as const },
                  ]).map(({ field, label, key }) => (
                    <div key={field}>
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</Label>
                      <div className="relative mt-1.5">
                        <Input type={showPw[key] ? "text" : "password"} {...register(field)} className="pr-10" />
                        <button type="button" onClick={() => setShowPw((s) => ({ ...s, [key]: !s[key] }))}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          {showPw[key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {errors[field] && <p className="mt-1 text-xs text-destructive">{errors[field]?.message}</p>}
                    </div>
                  ))}
                  <Button type="submit" disabled={isSubmitting}
                    className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                    <ShieldCheck className="h-4 w-4" />
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

              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <p className="font-medium text-sm">In-App Notifications</p>
                    <p className="text-xs text-muted-foreground">Receive notifications within the dashboard</p>
                  </div>
                  <Toggle value={notifications.inApp} onChange={() => setNotifications((n) => ({ ...n, inApp: !n.inApp }))} />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <p className="font-medium text-sm">Email Notifications</p>
                    <p className="text-xs text-muted-foreground">Receive important updates via email</p>
                  </div>
                  <Toggle value={notifications.email} onChange={() => setNotifications((n) => ({ ...n, email: !n.email }))} />
                </div>
              </div>

              <div>
                <p className="font-semibold text-sm mb-3">Notification Types</p>
                <p className="text-xs text-muted-foreground mb-3">You will receive notifications for the following events when enabled:</p>
                <div className="space-y-2">
                  {[
                    { key: "messages" as const, label: "Messages", desc: "New messages from landlords and property managers", color: "bg-primary" },
                    { key: "propertyUpdates" as const, label: "Property Updates", desc: "Changes to properties you're interested in or have bookings for", color: "bg-secondary" },
                    { key: "contractUpdates" as const, label: "Contract & Document Updates", desc: "Contract signatures, document uploads, and related activities", color: "bg-purple-500" },
                    { key: "systemAlerts" as const, label: "System Alerts", desc: "Important system notifications and security alerts", color: "bg-destructive" },
                  ].map(({ key, label, desc, color }) => (
                    <div key={key} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className={`h-2 w-2 rounded-full ${color}`} />
                        <div>
                          <p className="text-sm font-medium">{label}</p>
                          <p className="text-xs text-muted-foreground">{desc}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

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
