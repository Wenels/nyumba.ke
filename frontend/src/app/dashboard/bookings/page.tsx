"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { Calendar, CheckCircle2, XCircle, Clock, Eye, Search, Filter, List, Grid } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";

const TABS = ["ALL", "NEED_REVIEW", "VIEWING_SCHEDULED", "APPROVED", "REJECTED", "COMPLETED"];

export default function BookingsPage() {
  const [activeTab, setActiveTab] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["landlord-bookings"],
    queryFn: () => api.get("/api/bookings/landlord") as Promise<{ bookings: any[]; stats: any }>,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/api/bookings/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landlord-bookings"] });
      toast.success("Booking updated");
    },
    onError: (err) => {
      toast.error("Failed", { description: err instanceof ApiError ? (err.body as any)?.error : "Error" });
    },
  });

  const bookings = data?.bookings ?? [];
  const stats = data?.stats ?? { total: 0, needReview: 0, approved: 0 };

  const filtered = (activeTab === "ALL" ? bookings : bookings.filter((b: any) => b.status === activeTab))
    .filter((b: any) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return b.tenant?.fullName?.toLowerCase().includes(q) ||
             b.listing?.title?.toLowerCase().includes(q) ||
             b.unitType?.toLowerCase().includes(q);
    });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bookings Management</h1>
          <p className="mt-1 text-muted-foreground">Review and manage property booking requests</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Bookings", value: stats.total, icon: Calendar },
          { label: "Need Review", value: stats.needReview, icon: Clock, color: "text-secondary" },
          { label: "Approved", value: stats.approved, icon: CheckCircle2, color: "text-primary" },
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

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-card p-2 rounded-xl border border-border">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by property, tenant name, unit number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-4 rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" className="h-9 gap-2 bg-muted/50 text-muted-foreground font-medium w-full sm:w-auto">
            <Filter className="h-4 w-4" /> Filters <span className="text-[10px] ml-1">▼</span>
          </Button>

          <div className="flex items-center bg-muted/50 rounded-lg p-1 shrink-0 h-9">
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center justify-center px-3 h-full text-xs font-medium rounded-md transition-all ${
                viewMode === "list"
                  ? "bg-background text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`flex items-center justify-center px-3 h-full text-xs font-medium rounded-md transition-all ${
                viewMode === "grid"
                  ? "bg-background text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Grid
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === tab
                ? "bg-primary text-primary-foreground"
                : "border border-border hover:border-primary hover:text-primary"
            }`}
          >
            {tab.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Calendar className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 font-semibold">No bookings yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Bookings appear here once tenants book your properties</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((booking: any) => (
            <div key={booking.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold">{booking.tenant?.fullName}</p>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      booking.status === "APPROVED" ? "bg-primary/10 text-primary" :
                      booking.status === "NEED_REVIEW" || booking.status === "PENDING" ? "bg-yellow-100 text-yellow-700" :
                      booking.status === "REJECTED" ? "bg-destructive/10 text-destructive" :
                      "bg-muted text-muted-foreground"
                    }`}>{booking.status.replace("_", " ")}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground truncate">{booking.listing?.title}</p>
                  <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span>Unit: {booking.unitType}</span>
                    <span>Move-in: {format(new Date(booking.moveInDate), "dd MMM yyyy")}</span>
                    <span>Lease: {booking.leaseDuration} months</span>
                    {booking.viewingDate && <span>Viewing: {format(new Date(booking.viewingDate), "dd MMM yyyy, HH:mm")}</span>}
                  </div>
                  <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                    <span>{booking.tenant?.email}</span>
                    {booking.tenant?.phone && <span>{booking.tenant.phone}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {(booking.status === "PENDING" || booking.status === "NEED_REVIEW") && (
                    <>
                      <Button size="sm" onClick={() => statusMutation.mutate({ id: booking.id, status: "APPROVED" })}
                        className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => statusMutation.mutate({ id: booking.id, status: "REJECTED" })}
                        className="gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10">
                        <XCircle className="h-3.5 w-3.5" /> Reject
                      </Button>
                    </>
                  )}
                  {booking.status === "APPROVED" && (
                    <Button size="sm" variant="outline" onClick={() => statusMutation.mutate({ id: booking.id, status: "COMPLETED" })}
                      className="gap-1.5">
                      <Eye className="h-3.5 w-3.5" /> Mark Complete
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
