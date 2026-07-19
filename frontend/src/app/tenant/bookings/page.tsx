"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { CalendarCheck, Clock, CheckCircle2, XCircle, DollarSign } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

const STATUS_TABS = ["ALL", "PENDING", "NEED_REVIEW", "APPROVED", "REJECTED", "COMPLETED", "CANCELLED"];

export default function TenantBookingsPage() {
  const [activeTab, setActiveTab] = useState("ALL");
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["tenant-bookings"],
    queryFn: () => api.get("/api/bookings/tenant") as Promise<{ bookings: any[] }>,
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/api/bookings/${id}/cancel`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-bookings"] });
      toast.success("Booking cancelled");
    },
  });

  const bookings = data?.bookings ?? [];
  const filtered = bookings.filter((b) => {
    const matchTab = activeTab === "ALL" || b.status === activeTab;
    const matchSearch = !search || b.listing?.title?.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const stats = {
    total: bookings.length,
    awaiting: bookings.filter((b) => ["PENDING", "NEED_REVIEW"].includes(b.status)).length,
    approved: bookings.filter((b) => b.status === "APPROVED").length,
    totalPaid: bookings.filter((b) => b.feePaid).length * 1000,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Bookings</h1>
        <p className="mt-1 text-muted-foreground">Track and manage your property booking requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Bookings", value: stats.total, icon: CalendarCheck },
          { label: "Awaiting Action", value: stats.awaiting, icon: Clock, color: "text-secondary" },
          { label: "Approved", value: stats.approved, icon: CheckCircle2, color: "text-primary" },
          { label: "Total Paid", value: `KSh ${stats.totalPaid.toLocaleString()}`, icon: DollarSign, color: "text-primary" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{label}</p>
              <Icon className={`h-4 w-4 ${color || "text-muted-foreground"}`} />
            </div>
            <p className={`mt-2 text-xl font-bold ${color || ""}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Search + tabs */}
      <Input value={search} onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by property, location, or unit type..." />

      <div className="flex gap-2 flex-wrap">
        {STATUS_TABS.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === tab ? "bg-primary text-primary-foreground" : "border border-border hover:border-primary hover:text-primary"
            }`}>
            {tab.replace("_", " ")}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <CalendarCheck className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 font-semibold">No bookings yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Start by browsing available properties</p>
          <Link href="/browse">
            <Button className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90">Browse Properties</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((booking: any) => (
            <div key={booking.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold">{booking.listing?.title}</p>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      booking.status === "APPROVED" ? "bg-primary/10 text-primary" :
                      booking.status === "PENDING" || booking.status === "NEED_REVIEW" ? "bg-yellow-100 text-yellow-700" :
                      booking.status === "REJECTED" || booking.status === "CANCELLED" ? "bg-destructive/10 text-destructive" :
                      "bg-muted text-muted-foreground"
                    }`}>{booking.status.replace("_", " ")}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{booking.listing?.address}</p>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span>Unit: {booking.unitType}</span>
                    <span>Move-in: {format(new Date(booking.moveInDate), "dd MMM yyyy")}</span>
                    <span>Lease: {booking.leaseDuration} months</span>
                  </div>
                  {booking.contract && (
                    <Link href="/tenant/contracts" className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                      View Contract →
                    </Link>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {["PENDING", "NEED_REVIEW"].includes(booking.status) && (
                    <Button size="sm" variant="outline"
                      onClick={() => confirm("Cancel this booking?") && cancelMutation.mutate(booking.id)}
                      className="border-destructive/30 text-destructive hover:bg-destructive/10 gap-1.5">
                      <XCircle className="h-3.5 w-3.5" /> Cancel
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
