"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, Clock, AlertTriangle, TrendingUp, Download, Search, Filter, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const TABS = ["Rent Schedules", "Received Payments"];

function PaymentsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "Rent Schedules");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");

  useEffect(() => {
    const params = new URLSearchParams();
    if (activeTab && activeTab !== "Rent Schedules") params.set("tab", activeTab);
    if (searchQuery) params.set("search", searchQuery);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [activeTab, searchQuery, pathname, router]);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["landlord-payments"],
    queryFn: () => api.get("/api/rent-payments/landlord") as Promise<{ payments: any[]; stats: any }>,
  });

  const payments = data?.payments ?? [];
  const stats = data?.stats ?? { totalCollected: 0, thisMonth: 0, overdue: 0, dueSoon: 0 };

  const schedules = payments.filter((p: any) => p.status !== "PAID").filter((p: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return p.contract?.tenant?.fullName?.toLowerCase().includes(q) ||
           p.contract?.listing?.title?.toLowerCase().includes(q);
  });
  
  const received = payments.filter((p: any) => p.status === "PAID").filter((p: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return p.contract?.tenant?.fullName?.toLowerCase().includes(q) ||
           p.contract?.listing?.title?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rent Payments</h1>
          <p className="mt-1 text-muted-foreground">Monitor tenant rent schedules and collected payments</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => refetch()} 
            disabled={isFetching}
            className="text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl bg-primary p-4 text-primary-foreground">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-primary-foreground/70">Total Collected</p>
            <DollarSign className="h-4 w-4 text-primary-foreground/70" />
          </div>
          <p className="mt-2 text-2xl font-bold">KES {stats.totalCollected.toLocaleString()}</p>
        </div>
        <div className="rounded-xl bg-blue-600 p-4 text-white">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-white/70">This Month</p>
            <TrendingUp className="h-4 w-4 text-white/70" />
          </div>
          <p className="mt-2 text-2xl font-bold">KES {stats.thisMonth.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Overdue</p>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </div>
          <p className="mt-2 text-2xl font-bold text-destructive">{stats.overdue}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Due / Due Soon</p>
            <Clock className="h-4 w-4 text-secondary" />
          </div>
          <p className="mt-2 text-2xl font-bold text-secondary">{stats.dueSoon}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex rounded-lg border border-border bg-muted p-1 w-fit">
        {TABS.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}>{tab}</button>
        ))}
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-card p-2 rounded-xl border border-border">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={activeTab === "Rent Schedules" ? "Search by tenant name or property..." : "Search tenant, property, receipt..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-4 rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all border border-border"
          />
        </div>
        
        {activeTab === "Rent Schedules" && (
          <Button variant="outline" size="sm" className="h-9 gap-2 bg-muted/50 text-muted-foreground font-medium w-full sm:w-auto">
            <Filter className="h-4 w-4" /> Filters <span className="text-[10px] ml-1">▼</span>
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />)}
        </div>
      ) : (
        <div>
          {activeTab === "Rent Schedules" ? (
            schedules.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-12 text-center">
                <Clock className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-3 font-semibold">No schedules found</p>
                <p className="mt-1 text-sm text-muted-foreground">Rent schedules appear when contracts are activated</p>
              </div>
            ) : (
              <div className="space-y-2">
                {schedules.map((payment: any) => (
                  <div key={payment.id} className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">{payment.contract?.tenant?.fullName}</p>
                      <p className="text-xs text-muted-foreground">{payment.contract?.listing?.title} · Cycle {payment.cycleNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">KES {payment.amount.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Due: {format(new Date(payment.dueDate), "dd MMM yyyy")}</p>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        payment.status === "OVERDUE" ? "bg-destructive/10 text-destructive" :
                        payment.status === "DUE_NOW" ? "bg-secondary/10 text-secondary" :
                        "bg-muted text-muted-foreground"
                      }`}>{payment.status.replace("_", " ")}</span>
                      <Link href={`/dashboard/transactions/${payment.id}`}>
                        <Button variant="outline" size="sm" className="text-xs">
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            received.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-12 text-center">
                <DollarSign className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-3 font-semibold">No payments received yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {received.map((payment: any) => (
                  <div key={payment.id} className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">{payment.contract?.tenant?.fullName}</p>
                      <p className="text-xs text-muted-foreground">{payment.contract?.listing?.title}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">KES {payment.amount.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Paid: {payment.paidDate ? format(new Date(payment.paidDate), "dd MMM yyyy") : "-"}</p>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">PAID</span>
                      <Link href={`/dashboard/transactions/${payment.id}`}>
                        <Button variant="outline" size="sm" className="text-xs">
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

export default function PaymentsPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    }>
      <PaymentsContent />
    </Suspense>
  );
}
