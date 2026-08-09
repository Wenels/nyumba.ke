"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { DollarSign, Home, CreditCard, CalendarDays, ArrowRight, Download } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useState } from "react";

export default function TenantTransactionsPage() {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["tenant-payments"],
    queryFn: () => api.get("/api/rent-payments/tenant") as Promise<{ payments: any[]; stats: any }>,
  });

  const payments = data?.payments ?? [];
  const stats = data?.stats ?? { totalPaid: 0 };
  const paidPayments = payments.filter((p: any) => p.status === "PAID");

  const filtered = paidPayments.filter((p: any) =>
    !search || p.contract?.listing?.title?.toLowerCase().includes(search.toLowerCase())
  );

  const monthlyRentTotal = paidPayments.reduce((sum: number, p: any) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">All Transactions</h1>
          <p className="mt-1 text-muted-foreground">Booking fees, rent + deposit, and monthly rent payments</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" /> Export
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Paid", value: `KSh ${stats.totalPaid.toLocaleString()}`, icon: DollarSign, color: "text-primary" },
          { label: "Monthly Rent", value: `KSh ${monthlyRentTotal.toLocaleString()}`, icon: Home, color: "text-primary" },
          { label: "Booking Fees", value: "KSh 0", icon: CreditCard },
          { label: "Transactions", value: paidPayments.length, icon: CalendarDays },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{label}</p>
              <Icon className={`h-4 w-4 ${color || "text-muted-foreground"}`} />
            </div>
            <p className={`mt-2 text-lg font-bold ${color || ""}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Pay Monthly Rent CTA */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-primary/5 px-5 py-4">
        <div>
          <p className="font-semibold text-sm">Pay Monthly Rent</p>
          <p className="text-xs text-muted-foreground">View schedule, pay rent, and download receipts</p>
        </div>
        <Link href="/tenant/payments">
          <Button variant="outline" className="gap-2">
            Go to Rent <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>

      {/* Search */}
      <Input value={search} onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by property, location, receipt..." />

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <DollarSign className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-semibold">No transactions yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Your transaction history will appear here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((payment: any) => (
            <div key={payment.id} className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
              <div>
                <p className="text-sm font-medium">{payment.contract?.listing?.title}</p>
                <p className="text-xs text-muted-foreground">
                  Cycle {payment.cycleNumber} · {payment.paidDate ? format(new Date(payment.paidDate), "dd MMM yyyy") : "-"}
                </p>
                {payment.mpesaReceiptNo && (
                  <p className="text-xs text-muted-foreground">Receipt: {payment.mpesaReceiptNo}</p>
                )}
              </div>
              <div className="flex items-center gap-4 text-right">
                <div>
                  <p className="font-semibold text-primary">KSh {payment.amount.toLocaleString()}</p>
                  <span className="text-xs font-medium text-primary">RENT</span>
                </div>
                <Link href={`/tenant/transactions/${payment.id}`}>
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
