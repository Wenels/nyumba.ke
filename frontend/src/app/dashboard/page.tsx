"use client";

import Link from "next/link";
import {
  PlusCircle,
  ListChecks,
  DollarSign,
  Users,
  AlertCircle,
  ShieldX,
  Clock,
  ArrowRight,
  CheckCircle2,
  Home,
} from "lucide-react";
import { useAuth } from "@/app/features/auth/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Listing } from "@/app/features/listings/hooks/use-listings";

interface MyListingsResponse {
  listings: Listing[];
}

interface Booking {
  id: string;
  status: string;
  unitType: string;
  tenant?: { fullName: string };
  listing?: { title: string };
}

interface BookingsResponse {
  bookings: Booking[];
  stats: { total: number; needReview: number; approved: number };
}

interface Issue {
  id: string;
  status: string;
  subject: string;
  priority: string;
  listing?: { title: string };
}

interface IssuesResponse {
  issues: Issue[];
  stats: { total: number; open: number; critical: number; resolved: number };
}

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: listingsData } = useQuery<MyListingsResponse>({
    queryKey: ["my-listings"],
    queryFn: () => api.get("/api/listings/my") as Promise<MyListingsResponse>,
  });

  const { data: bookingsData } = useQuery<BookingsResponse>({
    queryKey: ["landlord-bookings"],
    queryFn: () => api.get("/api/bookings/landlord") as Promise<BookingsResponse>,
  });

  const { data: issuesData } = useQuery<IssuesResponse>({
    queryKey: ["landlord-issues"],
    queryFn: () => api.get("/api/issues/landlord") as Promise<IssuesResponse>,
  });

  const listings: Listing[] = listingsData?.listings ?? [];
  const bookings: Booking[] = bookingsData?.bookings ?? [];
  const issues: Issue[] = issuesData?.issues ?? [];

  const activeListings = listings.filter((l) => l.status === "ACTIVE").length;
  const monthlyRevenue = listings
    .filter((l) => l.status === "ACTIVE")
    .reduce((sum, l) => sum + l.price, 0);
  const pendingBookings = bookings.filter((b) => b.status === "NEED_REVIEW" || b.status === "PENDING");
  const openIssues = issues.filter((i) => i.status === "OPEN");
  const isVerified = user?.verification === "VERIFIED";
  const isPending = user?.verification === "PENDING";

  // Compute dynamic occupancy stats
  const totalUnits = listings.reduce((sum, l) => sum + (l.totalUnits || 0), 0);
  const totalVacant = listings.reduce((sum, l) => sum + (l.vacantCount || 0), 0);
  const occupiedUnits = totalUnits - totalVacant;
  const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

  // Active tenants = unique tenants with approved/completed bookings
  const uniqueTenantIds = new Set(bookings.filter((b) => b.status === "APPROVED" || b.status === "COMPLETED").map((b: any) => b.tenantId).filter(Boolean));
  const activeTenantCount = uniqueTenantIds.size;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="mt-1 text-muted-foreground">
          Welcome back! Here&apos;s what&apos;s happening with your properties
        </p>
      </div>

      {/* Verification banner */}
      {!isVerified && (
        <div className={`rounded-xl border p-4 flex items-center justify-between gap-4 ${
          isPending ? "border-yellow-200 bg-yellow-50 text-yellow-800" : "border-destructive/20 bg-destructive/5 text-destructive"
        }`}>
          <div className="flex items-center gap-3">
            {isPending ? <Clock className="h-5 w-5 shrink-0" /> : <ShieldX className="h-5 w-5 shrink-0" />}
            <div>
              <p className="font-semibold text-sm">
                {isPending ? "Verification under review" : "Your account is not verified"}
              </p>
              <p className="text-xs mt-0.5 opacity-80">
                {isPending ? "We'll notify you once approved." : "Verified landlords get more trust and visibility."}
              </p>
            </div>
          </div>
          {!isPending && (
            <Link href="/dashboard/verification" className="shrink-0 rounded-lg border border-current px-3 py-1.5 text-xs font-semibold hover:opacity-80">
              Get verified
            </Link>
          )}
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Properties */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total Properties</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
              <Home className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold">{listings.length}</p>
          <Link href="/dashboard/listings" className="mt-1 flex items-center gap-1 text-xs text-primary hover:underline">
            <ArrowRight className="h-3 w-3" /> Active listings: {activeListings}
          </Link>
        </div>

        {/* Monthly Revenue */}
        <div className="rounded-xl bg-gradient-to-br from-primary to-primary/70 p-5 text-primary-foreground">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-primary-foreground/70">Monthly Revenue</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-foreground/20">
              <DollarSign className="h-4 w-4 text-primary-foreground" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold">
            KSh {monthlyRevenue.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-primary-foreground/70">
            From {activeListings} active lease{activeListings !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Active Tenants */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Active Tenants</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold">
            {activeTenantCount}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {occupancyRate}% Occupancy rate
          </p>
        </div>

        {/* Open Issues */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Open Issues</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
              <AlertCircle className="h-4 w-4 text-secondary" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold">{openIssues.length}</p>
          <p className={`mt-1 text-xs ${openIssues.length === 0 ? "text-primary" : "text-secondary"}`}>
            {openIssues.length === 0 ? "All clear" : `${openIssues.length} need attention`}
          </p>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
        {/* Left — Bookings + Issues */}
        <div className="space-y-6">
          {/* Bookings requiring approval */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-border bg-primary/5 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <ListChecks className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Bookings Requiring Approval</p>
                  <p className="text-xs text-muted-foreground">{pendingBookings.length} pending requests</p>
                </div>
              </div>
              <Link href="/dashboard/bookings" className="flex items-center gap-1 text-xs text-primary hover:underline">
                View All <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="p-5">
              {pendingBookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle2 className="h-10 w-10 text-muted-foreground/30" />
                  <p className="mt-3 font-semibold text-muted-foreground">All caught up!</p>
                  <p className="mt-1 text-sm text-muted-foreground">No pending booking requests at the moment</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingBookings.slice(0, 3).map((booking: any) => (
                    <div key={booking.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div>
                        <p className="text-sm font-medium">{booking.tenant?.fullName}</p>
                        <p className="text-xs text-muted-foreground">{booking.listing?.title} · {booking.unitType}</p>
                      </div>
                      <Link href="/dashboard/bookings" className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90">
                        Review
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent tenant issues */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-border bg-secondary/5 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/10">
                  <AlertCircle className="h-4 w-4 text-secondary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Recent Tenant Issues</p>
                  <p className="text-xs text-muted-foreground">{openIssues.length} active issues</p>
                </div>
              </div>
              <Link href="/dashboard/issues" className="flex items-center gap-1 text-xs text-secondary hover:underline">
                View All <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="p-5">
              {openIssues.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle2 className="h-10 w-10 text-muted-foreground/30" />
                  <p className="mt-3 font-semibold text-muted-foreground">No active issues</p>
                  <p className="mt-1 text-sm text-muted-foreground">Your tenants haven&apos;t reported any issues</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {openIssues.slice(0, 3).map((issue: any) => (
                    <div key={issue.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div>
                        <p className="text-sm font-medium">{issue.subject}</p>
                        <p className="text-xs text-muted-foreground">{issue.listing?.title} · {issue.priority}</p>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        issue.priority === "CRITICAL" ? "bg-destructive/10 text-destructive" : "bg-secondary/10 text-secondary"
                      }`}>
                        {issue.priority}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right — Occupancy + Property Status + Quick Actions */}
        <div className="space-y-4">
          {/* Occupancy Rate */}
          <div className="rounded-xl bg-gradient-to-br from-primary to-primary/80 p-5 text-primary-foreground">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-foreground/20">
                <Users className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <p className="font-semibold text-sm">Occupancy Rate</p>
                <p className="text-xs text-primary-foreground/70">Overall performance</p>
              </div>
            </div>
            <p className="text-5xl font-bold">{occupancyRate}%</p>
            <div className="mt-3 h-1.5 rounded-full bg-primary-foreground/20">
              <div className="h-full rounded-full bg-primary-foreground" style={{ width: `${occupancyRate}%` }} />
            </div>
            <div className="mt-3 flex justify-between text-xs text-primary-foreground/70">
              <span>Occupied: {occupiedUnits}</span>
              <span>Total Units: {totalUnits}</span>
            </div>
          </div>

          {/* Property Status */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="font-semibold text-sm">Property Status</p>
              <Link href="/dashboard/listings" className="text-xs text-primary hover:underline">
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {listings.length === 0 ? (
              <div className="flex flex-col items-center py-4 text-center">
                <Home className="h-8 w-8 text-muted-foreground/30" />
                <p className="mt-2 text-xs text-muted-foreground">No recent property updates</p>
              </div>
            ) : (
              <div className="space-y-2">
                {listings.slice(0, 3).map((l) => (
                  <div key={l.id} className="flex items-center justify-between text-sm">
                    <p className="truncate text-xs">{l.title}</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      l.status === "ACTIVE" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    }`}>{l.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="font-semibold text-sm mb-3">Quick Actions</p>
            <div className="space-y-2">
              <Link href="/dashboard/post" className="flex items-center justify-between rounded-lg bg-primary/5 border border-primary/10 px-3 py-3 hover:bg-primary/10 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <PlusCircle className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold">Add Property</p>
                    <p className="text-xs text-muted-foreground">List new property</p>
                  </div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              </Link>
              <Link href="/dashboard/issues" className="flex items-center justify-between rounded-lg bg-secondary/5 border border-secondary/10 px-3 py-3 hover:bg-secondary/10 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/10">
                    <AlertCircle className="h-4 w-4 text-secondary" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold">Report Issue</p>
                    <p className="text-xs text-muted-foreground">Contact support</p>
                  </div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}