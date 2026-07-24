"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowRight,
  ChevronRight,
  DollarSign,
  FileText,
  Heart,
  Home,
  MessageSquare,
  Moon,
  Sun,
  TrendingUp,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/app/features/auth/hooks/use-auth";
import { api } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

export default function TenantOverviewPage() {
  const { user } = useAuth();

  const { data: bookingsData } = useQuery({
    queryKey: ["tenant-bookings"],
    queryFn: () =>
      api.get("/api/bookings/tenant") as Promise<{ bookings: any[] }>,
  });

  const { data: contractsData } = useQuery({
    queryKey: ["tenant-contracts"],
    queryFn: () =>
      api.get("/api/contracts/tenant") as Promise<{
        contracts: any[];
        stats: any;
      }>,
  });

  const { data: paymentsData } = useQuery({
    queryKey: ["tenant-payments"],
    queryFn: () =>
      api.get("/api/rent-payments/tenant") as Promise<{
        payments: any[];
        stats: any;
      }>,
  });

  const { data: issuesData } = useQuery({
    queryKey: ["tenant-issues"],
    queryFn: () =>
      api.get("/api/issues/tenant") as Promise<{ issues: any[]; stats: any }>,
  });

  const { data: savedData } = useQuery({
    queryKey: ["saved"],
    queryFn: () => api.get("/api/saved") as Promise<{ saved: any[] }>,
  });

  const bookings = bookingsData?.bookings ?? [];
  const contracts = contractsData?.contracts ?? [];
  const payments = paymentsData?.payments ?? [];
  const issues = issuesData?.issues ?? [];
  const saved = savedData?.saved ?? [];

  const activeContracts = contracts.filter(
    (c: { status: string }) => c.status === "ACTIVE",
  ).length;
  const pendingPayments = payments.filter((p: { status: string }) =>
    ["DUE_NOW", "OVERDUE", "DUE_SOON"].includes(p.status),
  ).length;
  const openIssues = issues.filter(
    (i: { status: string }) => i.status === "OPEN",
  ).length;
  const recentPayments = payments
    .filter((p: { status: string }) => p.status === "PAID")
    .slice(0, 3);
  const recentListings = saved.slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Hero greeting banner */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 text-primary-foreground shadow-lg border border-border/10"
        style={{
          backgroundImage: 'url("/apartment-bg.png")',
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/60 z-0" />

        <div className="relative z-10 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm">
            {getGreeting() === "Good Evening" ? (
              <Moon className="h-6 w-6 text-yellow-200" />
            ) : (
              <Sun className="h-6 w-6 text-amber-400" />
            )}
          </div>
          <div>
            <p className="text-xs text-white/70 font-medium">{getGreeting()}</p>
            <h1 className="text-2xl font-bold text-white mt-0.5">
              {user?.fullName.split(" ")[0]}!
            </h1>
          </div>
        </div>

        <p className="relative z-10 mt-3 text-white/80 text-sm max-w-xl">
          Welcome back to your dashboard. Here&apos;s an overview of your
          property journey.
        </p>

        {/* Mini stats */}
        <div className="relative z-10 mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              label: "Active Contracts",
              value: activeContracts,
              icon: FileText,
              iconBg: "bg-blue-500/20",
              iconColor: "text-blue-400",
            },
            {
              label: "Pending Payments",
              value: pendingPayments,
              icon: DollarSign,
              iconBg: "bg-amber-500/20",
              iconColor: "text-amber-400",
            },
            {
              label: "Saved Properties",
              value: saved.length,
              icon: Heart,
              iconBg: "bg-pink-500/20",
              iconColor: "text-pink-400",
            },
            {
              label: "Open Issues",
              value: openIssues,
              icon: AlertCircle,
              iconBg: "bg-red-500/20",
              iconColor: "text-red-400",
            },
          ].map(({ label, value, icon: Icon, iconBg, iconColor }) => (
            <div
              key={label}
              className="rounded-xl bg-black/35 backdrop-blur-md border border-white/10 p-3.5 flex flex-col justify-between h-28"
            >
              <div className="flex items-center justify-between">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconBg}`}
                >
                  <Icon className={`h-4 w-4 ${iconColor}`} />
                </div>
                <p className="text-2xl font-bold text-white">{value}</p>
              </div>
              <p className="text-[11px] font-medium text-white/70">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
        {/* Left column */}
        <div className="space-y-6">
          {/* Recent Payments */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <DollarSign className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Recent Payments</p>
                  <p className="text-xs text-muted-foreground">
                    Your payment history
                  </p>
                </div>
              </div>
              <Link
                href="/tenant/payments"
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                View All <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="p-5">
              {recentPayments.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <DollarSign className="h-10 w-10 text-muted-foreground/30" />
                  <p className="mt-3 text-sm text-muted-foreground">
                    No payment history yet
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentPayments.map((payment: any) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {payment.contract?.listing?.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Cycle {payment.cycleNumber}
                        </p>
                      </div>
                      <p className="font-semibold text-primary">
                        KSh {payment.amount.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recommended listings */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/10">
                  <Home className="h-4 w-4 text-secondary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Recommended For You</p>
                  <p className="text-xs text-muted-foreground">
                    Recently listed properties
                  </p>
                </div>
              </div>
              <Link
                href="/browse"
                className="flex items-center gap-1 text-xs text-secondary hover:underline"
              >
                Explore More <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="p-5">
              {recentListings.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <Home className="h-10 w-10 text-muted-foreground/30" />
                  <p className="mt-3 text-sm text-muted-foreground">
                    No saved properties yet
                  </p>
                  <Link
                    href="/browse"
                    className="mt-2 text-xs text-primary hover:underline"
                  >
                    Browse listings
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {recentListings.map((listing: any) => {
                    const photo = listing.photos?.[0];
                    return (
                      <Link
                        key={listing.id}
                        href={`/listings/${listing.slug}`}
                        className="group overflow-hidden rounded-lg border border-border hover:shadow-sm transition-shadow"
                      >
                        <div className="relative aspect-video bg-muted">
                          {photo ? (
                            <Image
                              src={`${API_URL}${photo.url}`}
                              alt={listing.title}
                              fill
                              sizes="200px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <Home className="h-6 w-6 text-muted-foreground/30" />
                            </div>
                          )}
                          <span className="absolute top-1.5 right-1.5 rounded-full bg-primary/90 px-1.5 py-0.5 text-xs font-medium text-primary-foreground">
                            New
                          </span>
                        </div>
                        <div className="p-2.5">
                          <p className="text-xs font-semibold truncate">
                            {listing.title}
                          </p>
                          <p className="text-xs text-secondary font-bold">
                            KSh {listing.price.toLocaleString()}/mo
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Saved Properties */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="font-semibold text-sm">Saved Properties</p>
              <Link
                href="/tenant/saved"
                className="text-xs text-primary hover:underline"
              >
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <p className="text-2xl font-bold">{saved.length}</p>
            <p className="text-xs text-muted-foreground">
              {saved.length === 0
                ? "No favorites yet"
                : `${saved.length} propert${saved.length !== 1 ? "ies" : "y"} saved`}
            </p>
            {saved.length === 0 && (
              <Link
                href="/browse"
                className="mt-3 flex items-center gap-1 text-xs text-secondary hover:underline"
              >
                Browse Properties <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>

          {/* Quick Actions */}
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="font-semibold text-sm mb-3">Quick Actions</p>
            <div className="space-y-2">
              {[
                {
                  href: "/browse",
                  icon: Home,
                  label: "Browse Properties",
                  desc: "Find your next home",
                },
                {
                  href: "/tenant/payments",
                  icon: DollarSign,
                  label: "Make Payment",
                  desc: "Pay rent online",
                },
                {
                  href: "/tenant/issues",
                  icon: AlertCircle,
                  label: "Report Issue",
                  desc: "Get help with maintenance",
                },
                {
                  href: "/tenant/inbox",
                  icon: MessageSquare,
                  label: "Messages",
                  desc: "Chat with landlords",
                },
              ].map(({ href, icon: Icon, label, desc }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-3 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold">{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </div>

          {/* Activity widget */}
          <div className="rounded-xl bg-gradient-to-br from-primary to-primary/80 p-5 text-primary-foreground">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="h-5 w-5 text-primary-foreground/70" />
              <div>
                <p className="font-semibold text-sm">Your Activity</p>
                <p className="text-xs text-primary-foreground/70">Last 30 days</p>
              </div>
            </div>
            <div className="mb-3">
              <div className="flex justify-between text-xs text-primary-foreground/70 mb-1">
                <span>Profile Completion</span>
                <span>{user?.phone ? "85%" : "60%"}</span>
              </div>
              <div className="h-1.5 rounded-full bg-primary-foreground/20">
                <div
                  className="h-full rounded-full bg-primary-foreground transition-all"
                  style={{ width: user?.phone ? "85%" : "60%" }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div>
                <p className="text-xs text-primary-foreground/70">Properties Viewed</p>
                <p className="text-lg font-bold">{saved.length}</p>
              </div>
              <div>
                <p className="text-xs text-primary-foreground/70">Bookings Made</p>
                <p className="text-lg font-bold">{bookings.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
