"use client";

import { useQuery } from "@tanstack/react-query";
import { DollarSign, Home, CreditCard, TrendingUp, Download, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function TransactionsPage() {
  const { data: paymentsData, isLoading } = useQuery({
    queryKey: ["landlord-payments"],
    queryFn: () => api.get("/api/rent-payments/landlord") as Promise<{ payments: any[]; stats: any }>,
  });

  const payments = paymentsData?.payments ?? [];
  const stats = paymentsData?.stats ?? { totalCollected: 0, thisMonth: 0 };
  const paidPayments = payments.filter((p) => p.status === "PAID");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">All Transactions</h1>
          <p className="mt-1 text-muted-foreground">Booking fees, deposits, and monthly rent</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl bg-primary p-4 text-primary-foreground">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-primary-foreground/70">Total Received</p>
            <DollarSign className="h-4 w-4 text-primary-foreground/70" />
          </div>
          <p className="mt-2 text-2xl font-bold">KSh {stats.totalCollected.toLocaleString()}</p>
        </div>
        <div className="rounded-xl bg-blue-600 p-4 text-white">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-white/70">Monthly Rent</p>
            <Home className="h-4 w-4 text-white/70" />
          </div>
          <p className="mt-2 text-2xl font-bold">KSh {stats.thisMonth.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">In Escrow</p>
            <CreditCard className="h-4 w-4 text-secondary" />
          </div>
          <p className="mt-2 text-2xl font-bold text-secondary">KSh 0</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Platform Fees</p>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-2 text-2xl font-bold">KSh 0</p>
        </div>
      </div>

      {/* Monitor rent quick link */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-primary/5 px-5 py-4">
        <div>
          <p className="font-semibold text-sm">Monitor Monthly Rent</p>
          <p className="text-xs text-muted-foreground">View schedules, track overdue, send tenant reminders</p>
        </div>
        <Link href="/dashboard/payments">
          <Button variant="outline" className="gap-2">
            View Rent <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>

      {/* Transactions list */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />)}
        </div>
      ) : paidPayments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <DollarSign className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-semibold">No payments yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Payments appear once tenants complete bookings</p>
        </div>
      ) : (
        <div className="space-y-2">
          {paidPayments.map((payment: any) => (
            <div key={payment.id} className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
              <div>
                <p className="text-sm font-medium">{payment.contract?.tenant?.fullName}</p>
                <p className="text-xs text-muted-foreground">
                  {payment.contract?.listing?.title} · Cycle {payment.cycleNumber}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-primary">KSh {payment.amount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">
                  {payment.paidDate ? format(new Date(payment.paidDate), "dd MMM yyyy") : "-"}
                </p>
              </div>
              <div className="flex items-center gap-3 ml-4">
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">RENT</span>
                <Link href={`/dashboard/transactions/${payment.id}`}>
                  <Button variant="outline" size="sm" className="text-xs">
                    View
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
