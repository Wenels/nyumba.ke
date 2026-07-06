"use client";

import Link from "next/link";
import {
  PlusCircle,
  ListChecks,
  MessageSquare,
  Heart,
  ShieldCheck,
  ShieldX,
  Clock,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/app/features/auth/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Listing } from "@/app/features/listings/hooks/use-listings";

interface MyListingsResponse {
  listings: Listing[];
}

export default function DashboardPage() {
  const { user } = useAuth();

  const { data } = useQuery<MyListingsResponse>({
    queryKey: ["my-listings"],
    queryFn: () => api.get("/api/listings/my") as Promise<MyListingsResponse>,
  });

  const listings: Listing[] = data?.listings ?? [];
  const active = listings.filter((l) => l.status === "ACTIVE").length;
  const expired = listings.filter((l) => l.status === "EXPIRED").length;
  const totalSaves = listings.reduce((acc, l) => acc + l._count.savedBy, 0);

  const isVerified = user?.verification === "VERIFIED";
  const isPending = user?.verification === "PENDING";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {user?.fullName.split(" ")[0]}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Here's an overview of your listings activity.
          </p>
        </div>
        <Link
          href="/dashboard/post"
          className="flex items-center gap-2 rounded-lg bg-secondary px-4 py-2.5 text-sm font-semibold text-secondary-foreground hover:bg-secondary/90 transition-colors"
        >
          <PlusCircle className="h-4 w-4" />
          Post listing
        </Link>
      </div>

      {/* Verification banner */}
      {!isVerified && (
        <div
          className={`rounded-xl border p-4 flex items-center justify-between gap-4 ${
            isPending
              ? "border-yellow-200 bg-yellow-50 text-yellow-800"
              : "border-destructive/20 bg-destructive/5 text-destructive"
          }`}
        >
          <div className="flex items-center gap-3">
            {isPending ? (
              <Clock className="h-5 w-5 shrink-0" />
            ) : (
              <ShieldX className="h-5 w-5 shrink-0" />
            )}
            <div>
              <p className="font-semibold text-sm">
                {isPending ? "Verification under review" : "Your account is not verified"}
              </p>
              <p className="text-xs mt-0.5 opacity-80">
                {isPending
                  ? "We'll notify you once your verification is approved."
                  : "Verified landlords get more trust and visibility from tenants."}
              </p>
            </div>
          </div>
          {!isPending && (
            <Link
              href="/dashboard/verification"
              className="shrink-0 rounded-lg border border-current px-3 py-1.5 text-xs font-semibold hover:opacity-80"
            >
              Get verified
            </Link>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            icon: ListChecks,
            label: "Active listings",
            value: active,
            href: "/dashboard/listings",
          },
          {
            icon: Clock,
            label: "Expired",
            value: expired,
            href: "/dashboard/listings",
          },
          {
            icon: Heart,
            label: "Total saves",
            value: totalSaves,
            href: "/dashboard/listings",
          },
          {
            icon: ShieldCheck,
            label: "Verification",
            value: user?.verification ?? "—",
            href: "/dashboard/verification",
          },
        ].map(({ icon: Icon, label, value, href }) => (
          <Link
            key={label}
            href={href}
            className="rounded-xl border border-border bg-card p-5 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {label}
              </span>
              <Icon className="h-4 w-4 text-secondary" />
            </div>
            <p className="mt-3 text-2xl font-bold capitalize">{value}</p>
          </Link>
        ))}
      </div>

      {/* Recent listings */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Recent listings</h2>
          <Link
            href="/dashboard/listings"
            className="flex items-center gap-1 text-sm text-secondary hover:underline"
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {listings.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            <PlusCircle className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 font-semibold">No listings yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Post your first listing to start receiving inquiries.
            </p>
            <Link
              href="/dashboard/post"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground hover:bg-secondary/90"
            >
              <PlusCircle className="h-4 w-4" />
              Post listing
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {listings.slice(0, 5).map((listing) => (
              <div
                key={listing.id}
                className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4"
              >
                <div className="min-w-0">
                  <p className="font-semibold truncate">{listing.title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Ksh {listing.price.toLocaleString()}/mo ·{" "}
                    {listing._count.savedBy} saves
                  </p>
                </div>
                <div className="flex items-center gap-3 ml-4 shrink-0">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      listing.status === "ACTIVE"
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {listing.status}
                  </span>
                  <Link
                    href={`/dashboard/edit/${listing.slug}`}
                    className="text-xs text-secondary hover:underline"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
