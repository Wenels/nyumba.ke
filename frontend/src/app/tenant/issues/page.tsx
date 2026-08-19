"use client";

import { useState, useEffect, Suspense } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { AlertCircle, CheckCircle2, Clock, Plus, X, Upload } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

const CATEGORIES = ["Plumbing", "Electrical", "Structural", "Security", "Pest Control", "Appliances", "Cleaning", "Other"];
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function IssuesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [priority, setPriority] = useState(searchParams.get("priority") || "");
  const [showModal, setShowModal] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [form, setForm] = useState({
    listingId: "",
    category: "",
    subject: "",
    description: "",
    priority: "MODERATE",
    reportedTo: "LANDLORD",
  });
  const queryClient = useQueryClient();

  // Sync status and priority to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (priority) params.set("priority", priority);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [status, priority, pathname, router]);

  const { data: issuesData, isLoading } = useQuery({
    queryKey: ["tenant-issues", status, priority],
    queryFn: () => {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (priority) params.set("priority", priority);
      return api.get(`/api/issues/tenant?${params}`) as Promise<{ issues: any[]; stats: any }>;
    },
  });

  const { data: contractsData } = useQuery({
    queryKey: ["tenant-contracts"],
    queryFn: () => api.get("/api/contracts/tenant") as Promise<{ contracts: any[] }>,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      photos.forEach((p) => formData.append("photos", p));

      const res = await fetch(`${API_URL}/api/issues`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-issues"] });
      setShowModal(false);
      setForm({ listingId: "", category: "", subject: "", description: "", priority: "MODERATE", reportedTo: "LANDLORD" });
      setPhotos([]);
      toast.success("Issue reported successfully!", { description: "Your landlord will review and respond within 24-48 hours." });
    },
    onError: () => toast.error("Failed to submit issue"),
  });

  const issues = issuesData?.issues ?? [];
  const stats = issuesData?.stats ?? { total: 0, open: 0, critical: 0, resolved: 0 };
  const contracts = contractsData?.contracts ?? [];

  // Auto-fill primary active contract when modal opens
  const activeContracts = contracts.filter((c: any) => c.status === "ACTIVE");
  const autoListingId = activeContracts.length === 1 ? (activeContracts[0].propertyId || activeContracts[0].listing?.id) : "";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Issues & Maintenance</h1>
          <p className="mt-1 text-muted-foreground">Report and track property issues</p>
        </div>
        <Button onClick={() => setShowModal(true)}
          className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Report Issue
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Issues", value: stats.total, icon: AlertCircle },
          { label: "Open Issues", value: stats.open, icon: Clock, color: "text-blue-500" },
          { label: "Critical", value: stats.critical, icon: AlertCircle, color: "text-destructive" },
          { label: "Avg Resolution", value: "0h", icon: CheckCircle2, color: "text-primary" },
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
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Status:</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)}
            className="rounded-md border border-input bg-background px-2 py-1 text-sm">
            <option value="">All Status</option>
            {["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].map((s) => (
              <option key={s} value={s}>{s.replace("_", " ")}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Priority:</span>
          <select value={priority} onChange={(e) => setPriority(e.target.value)}
            className="rounded-md border border-input bg-background px-2 py-1 text-sm">
            <option value="">All Priority</option>
            {["LOW", "MODERATE", "HIGH", "CRITICAL"].map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />)}
        </div>
      ) : issues.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 font-semibold">No issues found</p>
          <p className="mt-1 text-sm text-muted-foreground">Report your first maintenance issue</p>
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
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{issue.description}</p>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span>Category: {issue.category}</span>
                    <span>Property: {issue.listing?.title}</span>
                    <span>Reported: {format(new Date(issue.createdAt), "dd MMM yyyy")}</span>
                    {issue.resolvedAt && <span>Resolved: {format(new Date(issue.resolvedAt), "dd MMM yyyy")}</span>}
                  </div>
                  {issue.photos?.length > 0 && (
                    <div className="mt-3 flex gap-2 flex-wrap">
                      {issue.photos.map((photo: any) => (
                        <img key={photo.id} src={`${API_URL}${photo.url}`} alt="Issue"
                          className="h-16 w-16 rounded-lg object-cover border border-border" />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Report Issue Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-background shadow-xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <p className="font-semibold">Report an Issue</p>
                <p className="text-xs text-muted-foreground">Describe the problem you&apos;re experiencing</p>
              </div>
              <button onClick={() => setShowModal(false)}>
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Property selector */}
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Property *</Label>
                {autoListingId && (
                  <div className="mt-1.5 mb-1.5 rounded-lg bg-primary/5 border border-primary/20 px-3 py-2 text-xs text-primary font-semibold">
                    ✓ Auto-selected: {activeContracts[0]?.listing?.title} — Unit {activeContracts[0]?.unit?.unitNumber || activeContracts[0]?.unitNumber || "assigned"}
                  </div>
                )}
                <select value={form.listingId || autoListingId} onChange={(e) => setForm({ ...form, listingId: e.target.value })}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Select Property</option>
                  {contracts.map((c: any) => (
                    <option key={c.id} value={c.propertyId || c.listing?.id}>
                      {c.listing?.title} (Unit {c.unitNumber || c.unit?.unitNumber || "assigned"})
                    </option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Issue Category *</Label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Select Category</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Subject */}
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Subject *</Label>
                <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="Brief description of the issue" className="mt-1.5" />
              </div>

              {/* Description */}
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description *</Label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Provide detailed information about the issue..."
                  rows={3} className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              </div>

              {/* Priority + Report To */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Priority *</Label>
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    {["LOW", "MODERATE", "HIGH", "CRITICAL"].map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Report To *</Label>
                  <select value={form.reportedTo} onChange={(e) => setForm({ ...form, reportedTo: e.target.value })}
                    className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="LANDLORD">Landlord</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
              </div>

              {/* Photo upload */}
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Upload Images (Optional, Max 5)
                </Label>
                <label className="mt-1.5 flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border p-6 hover:border-primary transition-colors">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Click to upload images</span>
                  <input type="file" accept="image/*" multiple className="hidden"
                    onChange={(e) => setPhotos(Array.from(e.target.files ?? []).slice(0, 5))} />
                </label>
                {photos.length > 0 && (
                  <p className="mt-1 text-xs text-primary">{photos.length} file(s) selected</p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                  loading={createMutation.isPending}
                  disabled={!form.listingId || !form.category || !form.subject || !form.description}
                  onClick={() => createMutation.mutate()}>
                  {createMutation.isPending ? "Submitting..." : "Submit Issue"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TenantIssuesPage() {
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
