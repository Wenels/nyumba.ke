"use client";

import { useQuery } from "@tanstack/react-query";
import { Users, CheckCircle2, DollarSign, Home, Phone, Mail, MessageSquare, FileText } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

function TenantsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [search, setSearch] = useState(searchParams.get("search") || "");

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [search, pathname, router]);

  const { data, isLoading } = useQuery({
    queryKey: ["landlord-bookings"],
    queryFn: () => api.get("/api/bookings/landlord") as Promise<{ bookings: any[]; stats: any }>,
  });

  const bookings = data?.bookings ?? [];
  const approvedBookings = bookings.filter((b: any) => ["APPROVED", "COMPLETED"].includes(b.status));

  const filteredBookings = approvedBookings.filter((b: any) =>
    !search ||
    b.tenant?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    b.tenant?.email?.toLowerCase().includes(search.toLowerCase()) ||
    b.tenant?.phone?.includes(search)
  );

  const groupedTenants = Object.values(filteredBookings.reduce((acc: any, b: any) => {
    if (!b.tenant) return acc;
    if (!acc[b.tenant.id]) {
      acc[b.tenant.id] = { tenant: b.tenant, bookings: [] };
    }
    acc[b.tenant.id].bookings.push(b);
    return acc;
  }, {}));

  const uniqueTenantCount = new Set(approvedBookings.map((b: any) => b.tenant?.id).filter(Boolean)).size;

  const stats = {
    total: uniqueTenantCount,
    activeLeases: approvedBookings.filter((b: any) => ["APPROVED", "COMPLETED"].includes(b.status)).length,
    totalRevenue: approvedBookings.reduce((sum: number, b: any) => sum + (b.unitTypeDetails?.monthlyRent || 0), 0),
    properties: [...new Set(approvedBookings.map((b: any) => b.propertyId))].length,
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
      ) : groupedTenants.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Users className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 font-semibold">No tenants yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Tenants will appear here once they complete bookings</p>
        </div>
      ) : (
        <div className="space-y-3">
          {groupedTenants.map((group: any) => (
            <div key={group.tenant.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-bold text-base text-foreground">{group.tenant.fullName}</p>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{group.tenant.email}</span>
                    {group.tenant.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{group.tenant.phone}</span>}
                  </div>
                </div>

                <div className="shrink-0">
                  <Link href="/inbox">
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs font-semibold border-primary/30 text-primary hover:bg-primary/5">
                      <MessageSquare className="h-3.5 w-3.5" /> Message Tenant
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Per-Unit Tenancies List */}
              <div className="mt-4 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Assigned Units & Contracts ({group.bookings.length})</p>
                {group.bookings.map((booking: any) => {
                  const contractId = booking.contract?.id;
                  return (
                    <div key={booking.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/80 bg-muted/20 px-4 py-2.5 text-xs flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <span className="font-bold text-foreground text-sm">{booking.listing?.title}</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="font-medium text-muted-foreground">{booking.unitType}</span>
                        {booking.unit && (
                          <span className="rounded-md bg-primary/10 border border-primary/20 px-2 py-0.5 font-bold text-primary">
                            Door {booking.unit.unitNumber}
                          </span>
                        )}
                        <span className="text-muted-foreground">•</span>
                        <span className="font-bold text-foreground">
                          KSh {(booking.unitTypeDetails?.monthlyRent || booking.unit?.rentOverride || 0).toLocaleString()}/mo
                        </span>
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          booking.status === "COMPLETED" ? "bg-emerald-100 text-emerald-800" :
                          booking.status === "APPROVED" ? "bg-blue-100 text-blue-800" :
                          "bg-muted text-muted-foreground"
                        }`}>{booking.status}</span>
                      </div>

                      <div className="shrink-0 ml-auto">
                        {contractId ? (
                          <Link href={`/dashboard/contracts/${contractId}`}>
                            <Button size="sm" className="h-7 text-xs font-bold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90">
                              <FileText className="h-3 w-3" /> View Contract →
                            </Button>
                          </Link>
                        ) : (
                          <Link href="/dashboard/bookings">
                            <Button size="sm" variant="outline" className="h-7 text-xs font-medium text-muted-foreground">
                              View Booking →
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TenantsPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    }>
      <TenantsContent />
    </Suspense>
  );
}
