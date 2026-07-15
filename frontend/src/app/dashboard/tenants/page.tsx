"use client";

import { useQuery } from "@tanstack/react-query";
import { Users, CheckCircle2, DollarSign, Home, Phone, Mail, MessageSquare } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function TenantsPage() {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["landlord-bookings"],
    queryFn: () => api.get("/api/bookings/landlord") as Promise<{ bookings: any[]; stats: any }>,
  });

  const bookings = data?.bookings ?? [];
  const approvedBookings = bookings.filter((b) => ["APPROVED", "COMPLETED"].includes(b.status));

  const filtered = approvedBookings.filter((b) =>
    !search ||
    b.tenant?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    b.tenant?.email?.toLowerCase().includes(search.toLowerCase()) ||
    b.tenant?.phone?.includes(search)
  );

  const stats = {
    total: approvedBookings.length,
    activeLeases: approvedBookings.filter((b) => b.status === "APPROVED").length,
    totalRevenue: approvedBookings.reduce((sum: number, b: any) => sum + (b.listing?.price || 0), 0),
    properties: [...new Set(approvedBookings.map((b: any) => b.listingId))].length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tenant Management</h1>
        <p className="mt-1 text-muted-foreground">Manage your tenants and track payments</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Tenants", value: stats.total, icon: Users },
          { label: "Active Leases", value: stats.activeLeases, icon: CheckCircle2, color: "text-primary" },
          { label: "Total Revenue", value: `KSh ${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-primary" },
          { label: "Properties", value: stats.properties, icon: Home, color: "text-secondary" },
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

      {/* Search */}
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search tenants by name, email, or phone..."
      />

      {/* Tenant list */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Users className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 font-semibold">No tenants yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Tenants will appear here once they complete bookings</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((booking: any) => (
            <div key={booking.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-semibold">{booking.tenant?.fullName}</p>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{booking.tenant?.email}</span>
                    {booking.tenant?.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{booking.tenant.phone}</span>}
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {booking.listing?.title} · {booking.unitType} · KSh {booking.listing?.price?.toLocaleString()}/mo
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    booking.status === "APPROVED" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  }`}>{booking.status}</span>
                  <Link href="/inbox">
                    <Button size="sm" variant="outline" className="gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5" /> Message
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
