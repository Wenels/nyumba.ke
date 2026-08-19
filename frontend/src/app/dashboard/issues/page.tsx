"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2, Clock, MessageSquare, X, Upload } from "lucide-react";
import { format } from "date-fns";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const CATEGORIES = ["System Bug", "Billing Issue", "Plumbing", "Electrical", "Structural", "Tenant Dispute", "Other"];

function IssuesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [priority, setPriority] = useState(searchParams.get("priority") || "");
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);

  const [form, setForm] = useState({
    propertyId: "",
    category: "",
    subject: "",
    description: "",
    priority: "MODERATE",
  });

  useEffect(() => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (priority) params.set("priority", priority);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [status, priority, pathname, router]);

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["landlord-issues", status, priority],
    queryFn: () => {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (priority) params.set("priority", priority);
      return api.get(`/api/issues/landlord?${params}`) as Promise<{ issues: any[]; stats: any }>;
    },
  });

  const { data: propertiesData } = useQuery({
    queryKey: ["my-properties"],
    queryFn: () => api.get("/api/properties/my") as Promise<{ properties: any[] }>,
    enabled: isReportModalOpen,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/api/issues/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landlord-issues"] });
      toast.success("Issue status updated!");
    },
    onError: () => toast.error("Failed to update status"),
  });

  const reportAdminMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append("propertyId", form.propertyId);
      formData.append("category", form.category);
      formData.append("subject", form.subject);
      formData.append("description", form.description);
      formData.append("priority", form.priority);
      formData.append("reportedTo", "ADMIN");
      photos.forEach((p) => formData.append("photos", p));

      const res = await fetch(`${API_URL}/api/issues`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to report issue");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landlord-issues"] });
      setIsReportModalOpen(false);
      setForm({ propertyId: "", category: "", subject: "", description: "", priority: "MODERATE" });
      setPhotos([]);
      toast.success("Issue submitted to Admin successfully!");
    },
    onError: () => toast.error("Failed to report issue to admin"),
  });

  const issues = data?.issues ?? [];
  const stats = data?.stats ?? { total: 0, open: 0, critical: 0, resolved: 0 };
  const properties = propertiesData?.properties ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Issues & Maintenance</h1>
          <p className="mt-1 text-muted-foreground">Manage tenant reported issues and escalate to system admin</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => setIsReportModalOpen(true)}>
          <AlertCircle className="h-4 w-4 text-destructive" /> Report to Admin
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Issues", value: stats.total, icon: AlertCircle },
          { label: "Open Issues", value: stats.open, icon: Clock, color: "text-blue-500" },
          { label: "Critical", value: stats.critical, icon: AlertCircle, color: "text-destructive" },
          { label: "Resolved", value: stats.resolved, icon: CheckCircle2, color: "text-primary" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{label}</p>
              <Icon className={`h-4 w-4 ${color || "text-muted-foreground"}`} />
            </div>
            <p className={`mt-2 text-2xl font-bold ${color || ""}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="">All Status</option>
          {["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].map((s) => (
            <option key={s} value={s}>{s.replace("_", " ")}</option>
          ))}
        </select>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="">All Priority</option>
          {["LOW", "MODERATE", "HIGH", "CRITICAL"].map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />)}
        </div>
      ) : issues.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 font-semibold">No issues found</p>
          <p className="mt-1 text-sm text-muted-foreground">No maintenance issues to display</p>
        </div>
      ) : (
        <div className="space-y-3">
          {issues.map((issue: any) => (
            <div key={issue.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold">{issue.subject}</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      issue.priority === "CRITICAL" ? "bg-destructive/10 text-destructive" :
                      issue.priority === "HIGH" ? "bg-secondary/10 text-secondary" :
                      "bg-muted text-muted-foreground"
                    }`}>{issue.priority}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      issue.status === "OPEN" ? "bg-blue-100 text-blue-700" :
                      issue.status === "RESOLVED" ? "bg-primary/10 text-primary" :
                      "bg-muted text-muted-foreground"
                    }`}>{issue.status.replace("_", " ")}</span>
                    {issue.reportedTo === "ADMIN" && (
                      <span className="rounded-full bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 text-xs font-bold">
                        Escalated to Admin
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{issue.description}</p>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span>Category: {issue.category}</span>
                    <span>Tenant: <strong className="text-foreground">{issue.tenant?.fullName || "N/A"}</strong></span>
                    <span>Property: {issue.listing?.title}</span>
                    <span>{format(new Date(issue.createdAt), "dd MMM yyyy")}</span>
                  </div>
                  {issue.photos?.length > 0 && (
                    <div className="mt-3 flex gap-2">
                      {issue.photos.map((photo: any) => (
                        <img key={photo.id} src={`${API_URL}${photo.url}`} alt="Issue" className="h-16 w-16 rounded-lg object-cover border border-border" />
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {issue.tenant && (
                    <Link href="/inbox">
                      <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold border-primary/30 text-primary hover:bg-primary/5">
                        <MessageSquare className="h-3.5 w-3.5" /> Message Tenant
                      </Button>
                    </Link>
                  )}
                  {issue.status === "OPEN" && (
                    <Button
                      size="sm"
                      loading={updateMutation.isPending}
                      onClick={() => updateMutation.mutate({ id: issue.id, status: "IN_PROGRESS" })}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold"
                    >
                      Start Repair Work →
                    </Button>
                  )}
                  {issue.status === "IN_PROGRESS" && (
                    <Button
                      size="sm"
                      loading={updateMutation.isPending}
                      onClick={() => updateMutation.mutate({ id: issue.id, status: "RESOLVED" })}
                      className="bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold"
                    >
                      ✓ Mark Issue Resolved
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Report to Admin Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="bg-background rounded-xl shadow-lg w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-start justify-between px-6 py-5 bg-muted/30 border-b border-border">
              <div>
                <h2 className="text-xl font-bold text-foreground">Report Issue to Admin</h2>
                <p className="text-sm text-muted-foreground mt-1">Submit a platform bug, billing issue, or tenant dispute to admins</p>
              </div>
              <button 
                onClick={() => setIsReportModalOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Modal Body (Scrollable) */}
            <div className="p-6 overflow-y-auto space-y-5">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-muted-foreground">Property *</Label>
                <select
                  value={form.propertyId}
                  onChange={(e) => setForm({ ...form, propertyId: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Select Property *</option>
                  {properties.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name || p.title}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-muted-foreground">
                  Issue Category <span className="text-destructive">*</span>
                </Label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Select Category</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-muted-foreground">
                  Subject <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="Brief description of the issue"
                  className="py-2.5"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-muted-foreground">
                  Description <span className="text-destructive">*</span>
                </Label>
                <textarea 
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[120px] resize-y placeholder:text-muted-foreground"
                  placeholder="Provide detailed information about the issue..."
                ></textarea>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-muted-foreground">
                  Priority <span className="text-destructive">*</span>
                </Label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="LOW">Low</option>
                  <option value="MODERATE">Moderate</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                  Upload Images (Optional, Max 5)
                </Label>
                <label className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-muted/30 transition-colors cursor-pointer group">
                  <Upload className="h-6 w-6 text-muted-foreground mb-2 group-hover:text-primary transition-colors" />
                  <p className="text-sm text-muted-foreground">Click to upload images</p>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => setPhotos(Array.from(e.target.files ?? []).slice(0, 5))}
                  />
                </label>
                {photos.length > 0 && (
                  <p className="text-xs text-primary">{photos.length} image(s) selected</p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between gap-4 px-6 py-4 border-t border-border bg-background">
              <Button 
                variant="outline" 
                className="flex-1 bg-muted/50 py-5"
                onClick={() => setIsReportModalOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90 py-5"
                loading={reportAdminMutation.isPending}
                disabled={!form.propertyId || !form.category || !form.subject || !form.description}
                onClick={() => reportAdminMutation.mutate()}
              >
                Submit to Admin
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function IssuesPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    }>
      <IssuesContent />
    </Suspense>
  );
}
