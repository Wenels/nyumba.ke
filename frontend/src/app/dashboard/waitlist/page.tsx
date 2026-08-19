"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ListChecks,
  Home,
  User,
  Mail,
  Phone,
  Clock,
  Calendar,
  DollarSign,
  MessageSquare,
  FileText,
  Search,
  Filter,
  CheckCircle2,
  BellRing,
} from "lucide-react";
import { format } from "date-fns";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Link from "next/link";

export default function WaitlistPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [propertyFilter, setPropertyFilter] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["landlord-waitlist"],
    queryFn: () =>
      api.get("/api/listings/waitlist/landlord") as Promise<{ waitlist: any[] }>,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/api/listings/waitlist/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landlord-waitlist"] });
      toast.success("Waitlist entry status updated!");
    },
    onError: () => toast.error("Failed to update status"),
  });

  const waitlist = data?.waitlist ?? [];

  // Filtered entries
  const filteredWaitlist = waitlist.filter((item: any) => {
    const matchesSearch =
      !search.trim() ||
      item.tenant?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      item.tenant?.email?.toLowerCase().includes(search.toLowerCase()) ||
      item.property?.name?.toLowerCase().includes(search.toLowerCase()) ||
      item.notes?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = !statusFilter || item.status === statusFilter;
    const matchesProperty = !propertyFilter || item.property?.id === propertyFilter;

    return matchesSearch && matchesStatus && matchesProperty;
  });

  // Unique properties for filter dropdown
  const uniqueProperties = Array.from(
    new Map<string, string>(
      waitlist.map((item: any) => [item.property?.id || "", item.property?.name || ""])
    ).entries()
  );

  // Quick Stats
  const stats = {
    total: waitlist.length,
    waiting: waitlist.filter((i: any) => i.status === "WAITING").length,
    notified: waitlist.filter((i: any) => i.status === "NOTIFIED").length,
    offered: waitlist.filter((i: any) => i.status === "OFFERED" || i.status === "FULFILLED").length,
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Tenant Waitlist & Preferences
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Review prospective tenants&apos; preferred unit types, move-in dates, max budgets, and specific requests.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Waiting", value: stats.total, icon: ListChecks, color: "text-foreground" },
          { label: "Pending Alert", value: stats.waiting, icon: Clock, color: "text-amber-500" },
          { label: "Notified / Contacted", value: stats.notified, icon: BellRing, color: "text-blue-500" },
          { label: "Matched / Fulfilled", value: stats.offered, icon: CheckCircle2, color: "text-emerald-600" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground font-medium">{label}</p>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <p className={`mt-2 text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap gap-3 items-center justify-between bg-card p-3 rounded-xl border border-border">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tenant name, email, or notes..."
            className="pl-9 h-9 text-xs bg-background"
          />
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          <select
            value={propertyFilter}
            onChange={(e) => setPropertyFilter(e.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-3 text-xs font-medium focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All Properties</option>
            {uniqueProperties.map(([id, name]: [any, any]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-3 text-xs font-medium focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All Statuses</option>
            <option value="WAITING">WAITING</option>
            <option value="NOTIFIED">NOTIFIED</option>
            <option value="OFFERED">OFFERED</option>
            <option value="FULFILLED">FULFILLED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : filteredWaitlist.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center bg-card">
          <ListChecks className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="mt-3 font-bold text-foreground">No waitlist entries found</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {search || statusFilter || propertyFilter
              ? "No entries match your search filters."
              : "When prospective tenants join the waitlist for your fully occupied properties, their preferences will appear here."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredWaitlist.map((item: any) => {
            const tenant = item.tenant;
            const property = item.property;
            const unitType = item.unitType;

            return (
              <div
                key={item.id}
                className="rounded-2xl border border-border bg-card p-5 shadow-xs transition-all hover:border-primary/30"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  {/* Left Column: Property & Tenant Details */}
                  <div className="space-y-2.5 flex-1 min-w-[280px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="flex items-center gap-1.5 font-bold text-sm text-foreground">
                        <Home className="h-4 w-4 text-primary shrink-0" />
                        {property?.name}
                      </span>
                      <span className="rounded-full bg-secondary/15 px-2.5 py-0.5 text-xs font-bold text-secondary border border-secondary/20">
                        {unitType?.label || "Any Unit Type"}
                      </span>
                      {unitType?.monthlyRent && (
                        <span className="text-xs text-muted-foreground">
                          (Listed: Ksh {unitType.monthlyRent.toLocaleString()}/mo)
                        </span>
                      )}
                    </div>

                    {/* Tenant Info Pills */}
                    <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5 font-semibold text-foreground">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        {tenant?.fullName}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        {tenant?.email}
                      </span>
                      {tenant?.phone && (
                        <span className="flex items-center gap-1.5 font-medium text-foreground">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                          {tenant.phone}
                        </span>
                      )}
                    </div>

                    {/* Tenant Preferences: Move-in date & Max Budget */}
                    <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                      {item.preferredDate && (
                        <div className="flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1 text-foreground font-medium border border-border">
                          <Calendar className="h-3.5 w-3.5 text-primary" />
                          <span>Target Move-in: <strong>{format(new Date(item.preferredDate), "dd MMM yyyy")}</strong></span>
                        </div>
                      )}
                      {item.maxBudget && (
                        <div className="flex items-center gap-1.5 rounded-md bg-emerald-50 text-emerald-800 px-2.5 py-1 font-medium border border-emerald-200">
                          <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Max Budget: <strong>Ksh {item.maxBudget.toLocaleString()}/mo</strong></span>
                        </div>
                      )}
                    </div>

                    {/* Notes / Special Requests */}
                    {item.notes && (
                      <div className="rounded-xl border border-border bg-muted/30 p-3 text-xs text-foreground space-y-1 mt-1">
                        <p className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider flex items-center gap-1">
                          <FileText className="h-3 w-3" /> Tenant Notes & Preferences
                        </p>
                        <p className="text-foreground leading-relaxed font-medium">
                          &ldquo;{item.notes}&rdquo;
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Status & Direct Actions */}
                  <div className="flex flex-col items-end gap-3 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Joined {format(new Date(item.createdAt), "dd MMM yyyy")}
                      </span>
                    </div>

                    {/* Status Dropdown */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-medium">Status:</span>
                      <select
                        value={item.status}
                        onChange={(e) =>
                          updateStatusMutation.mutate({ id: item.id, status: e.target.value })
                        }
                        className={`rounded-lg border px-2.5 py-1 text-xs font-bold transition-all focus:ring-2 ${
                          item.status === "WAITING"
                            ? "border-amber-300 bg-amber-50 text-amber-900"
                            : item.status === "NOTIFIED"
                            ? "border-blue-300 bg-blue-50 text-blue-900"
                            : item.status === "OFFERED" || item.status === "FULFILLED"
                            ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                            : "border-border bg-muted text-muted-foreground"
                        }`}
                      >
                        <option value="WAITING">WAITING</option>
                        <option value="NOTIFIED">NOTIFIED</option>
                        <option value="OFFERED">OFFERED</option>
                        <option value="FULFILLED">FULFILLED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </div>

                    {/* Message Tenant / Offer Unit Actions */}
                    <div className="flex items-center gap-2">
                      {item.status === "WAITING" && (
                        <Button
                          size="sm"
                          onClick={() => {
                            updateStatusMutation.mutate({ id: item.id, status: "OFFERED" });
                            toast.success("Status updated to Offered!");
                          }}
                          className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold shadow-xs">
                          <BellRing className="h-3.5 w-3.5" /> Offer Vacant Unit →
                        </Button>
                      )}
                      <Link href="/inbox">
                        <Button size="sm" variant="outline" className="gap-1.5 text-xs font-semibold border-primary/30 text-primary hover:bg-primary/5">
                          <MessageSquare className="h-3.5 w-3.5" /> Message Tenant
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
