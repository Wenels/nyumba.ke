"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { FileText, CheckCircle2, Clock, Lock, PenLine } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function TenantContractsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["tenant-contracts"],
    queryFn: () => api.get("/api/contracts/tenant") as Promise<{ contracts: any[]; stats: any }>,
  });

  const signMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/api/contracts/${id}/sign`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-contracts"] });
      toast.success("Contract signed!");
    },
    onError: () => toast.error("Failed to sign contract"),
  });

  const contracts = data?.contracts ?? [];
  const stats = data?.stats ?? { total: 0, active: 0, pending: 0, locked: 0 };

  const filtered = contracts.filter((c) => {
    const matchStatus = !statusFilter || c.status === statusFilter;
    const matchSearch = !search || c.listing?.title?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Contracts</h1>
        <p className="mt-1 text-muted-foreground">View and manage your lease agreements</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Contracts", value: stats.total, icon: FileText },
          { label: "Active", value: stats.active, icon: CheckCircle2, color: "text-primary" },
          { label: "Pending", value: stats.pending, icon: Clock, color: "text-secondary" },
          { label: "Locked", value: stats.locked, icon: Lock, color: "text-blue-500" },
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
      <div className="flex gap-3">
        <Input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by property name, location..." className="flex-1 max-w-sm" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm">
          <option value="">All Status</option>
          {["PENDING", "ACTIVE", "EXPIRED", "TERMINATED"].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 font-semibold">No contracts yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Your lease agreements will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((contract: any) => (
            <div key={contract.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold">{contract.listing?.title}</p>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      contract.status === "ACTIVE" ? "bg-primary/10 text-primary" :
                      contract.status === "PENDING" ? "bg-yellow-100 text-yellow-700" :
                      contract.status === "EXPIRED" ? "bg-muted text-muted-foreground" :
                      "bg-destructive/10 text-destructive"
                    }`}>{contract.status}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{contract.listing?.address}</p>
                  <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span>Unit: {contract.unitType}</span>
                    <span>Rent: KSh {contract.monthlyRent.toLocaleString()}/mo</span>
                    <span>Deposit: KSh {contract.securityDeposit.toLocaleString()}</span>
                    <span>Start: {format(new Date(contract.startDate), "dd MMM yyyy")}</span>
                    <span>End: {format(new Date(contract.endDate), "dd MMM yyyy")}</span>
                  </div>
                  <div className="mt-2 flex gap-3 text-xs">
                    <span className={`flex items-center gap-1 ${contract.signedByTenant ? "text-primary" : "text-muted-foreground"}`}>
                      <CheckCircle2 className="h-3 w-3" /> Tenant signed
                    </span>
                    <span className={`flex items-center gap-1 ${contract.signedByLandlord ? "text-primary" : "text-muted-foreground"}`}>
                      <CheckCircle2 className="h-3 w-3" /> Landlord signed
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Landlord: {contract.landlord?.fullName} · {contract.landlord?.phone}
                  </div>
                </div>
                <div className="shrink-0">
                  {contract.status === "PENDING" && !contract.signedByTenant && (
                    <Button size="sm"
                      onClick={() => signMutation.mutate(contract.id)}
                      disabled={signMutation.isPending}
                      className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90">
                      <PenLine className="h-3.5 w-3.5" /> Sign Contract
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
