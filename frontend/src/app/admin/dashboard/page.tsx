"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Users, ListChecks, Flag, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";

interface Stats {
  users: number;
  listings: number;
  reports: number;
  pendingVerifications: number;
}

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => api.get("/api/admin/stats") as Promise<{ stats: Stats }>,
  });

  const stats = data?.stats;

  const CARDS = [
    { icon: Users, label: "Total users", value: stats?.users, href: "/admin/users", color: "text-blue-500" },
    { icon: ListChecks, label: "Active listings", value: stats?.listings, href: "/admin/listings", color: "text-primary" },
    { icon: Flag, label: "Open reports", value: stats?.reports, href: "/admin/reports", color: "text-destructive" },
    { icon: ShieldCheck, label: "Pending verifications", value: stats?.pendingVerifications, href: "/admin/verifications", color: "text-secondary" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-background">Dashboard</h1>
        <p className="mt-1 text-background/50">Overview of Nyumba.ke platform activity.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CARDS.map(({ icon: Icon, label, value, href, color }) => (
          <Link
            key={label}
            href={href}
            className="rounded-xl border border-background/10 bg-background/5 p-5 hover:bg-background/10 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-background/40">
                {label}
              </span>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <p className="mt-3 text-3xl font-bold text-background">
              {isLoading ? "—" : value ?? 0}
            </p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {[
          { href: "/admin/verifications", label: "Review verifications", desc: "Approve or reject pending landlord verifications" },
          { href: "/admin/reports", label: "Resolve reports", desc: "Review flagged listings and take action" },
          { href: "/admin/listings", label: "Manage listings", desc: "View, remove, or change status of any listing" },
          { href: "/admin/users", label: "Manage users", desc: "View all users, change roles, or remove accounts" },
        ].map(({ href, label, desc }) => (
          <Link
            key={href}
            href={href}
            className="rounded-xl border border-background/10 bg-background/5 p-5 hover:bg-background/10 transition-colors"
          >
            <p className="font-semibold text-background">{label}</p>
            <p className="mt-1 text-sm text-background/50">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
