"use client";

import { useState, useEffect, Suspense } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { DollarSign, Clock, AlertTriangle, CheckCircle2, CalendarDays } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

const FILTER_PILLS = ["All", "Due Soon", "Due Now", "Overdue", "Upcoming", "Paid"];

interface Payment {
  id: string;
  amount: number;
  dueDate: string;
  cycleNumber: number;
  status: string;
  contract?: {
    listing?: {
      title?: string;
    };
  };
}

function PaymentsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "Rent Schedule");
  const [filter, setFilter] = useState(searchParams.get("filter") || "All");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [payingId, setPayingId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "polling" | "success" | "timeout">("idle");
  const queryClient = useQueryClient();

  // Sync tab and filter to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (activeTab && activeTab !== "Rent Schedule") params.set("tab", activeTab);
    if (filter && filter !== "All") params.set("filter", filter);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [activeTab, filter, pathname, router]);

  const { data, isLoading } = useQuery({
    queryKey: ["tenant-payments"],
    queryFn: () => api.get("/api/rent-payments/tenant") as Promise<{ payments: Payment[]; stats: any }>,
  });

  const payMutation = useMutation({
    mutationFn: ({ id, phone }: { id: string; phone: string }) =>
      api.post(`/api/rent-payments/${id}/pay`, { phone }),
    onSuccess: () => {
      setPaymentStatus("polling");
      toast.success("STK Push sent!", { description: "Please check your phone for the M-Pesa prompt." });
    },
    onError: (err: any) => {
      toast.error("Payment initiation failed", { description: err?.body?.error || "Error" });
      setPaymentStatus("idle");
    },
  });

  const simulatePaymentMutation = useMutation({
    mutationFn: () => api.post(`/api/rent-payments/${payingId}/confirm-payment`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-payments"] });
      setPaymentStatus("success");
      toast.success("Payment completed successfully!");
      setTimeout(() => {
        setPayingId(null);
        setPaymentStatus("idle");
      }, 3000);
    },
  });

  useEffect(() => {
    if (paymentStatus !== "polling" || !payingId) return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await api.get(`/api/rent-payments/tenant`) as { payments: Payment[] };
        const payment = res.payments?.find(p => p.id === payingId);
        if (payment?.status === "PAID") {
          setPaymentStatus("success");
          clearInterval(pollInterval);
          toast.success("Payment completed successfully!");
          queryClient.invalidateQueries({ queryKey: ["tenant-payments"] });
          setTimeout(() => {
            setPayingId(null);
            setPaymentStatus("idle");
          }, 3000);
        }
      } catch (err) {
        console.error("Polling error", err);
      }
    }, 3000);

    const timeout = setTimeout(() => {
      if (paymentStatus === "polling") {
        setPaymentStatus("timeout");
        toast.error("Payment timed out");
        clearInterval(pollInterval);
      }
    }, 60000);

    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeout);
    };
  }, [paymentStatus, payingId, queryClient]);

  const payments: Payment[] = data?.payments ?? [];
  const stats = data?.stats ?? { dueOverdue: 0, totalPaid: 0, upcoming: 0, totalCycles: 0 };

  const filterMap: Record<string, string> = {
    "Due Soon": "DUE_SOON",
    "Due Now": "DUE_NOW",
    Overdue: "OVERDUE",
    Upcoming: "UPCOMING",
    Paid: "PAID",
  };

  const schedules = payments.filter((p: Payment) => p.status !== "PAID");
  const received = payments.filter((p: Payment) => p.status === "PAID");
  const displayPayments = activeTab === "Rent Schedule"
    ? (filter === "All" ? schedules : schedules.filter((p: Payment) => p.status === filterMap[filter]))
    : received;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Rent Payments</h1>
        <p className="mt-1 text-muted-foreground">Track and pay your monthly rent</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Due / Overdue", value: stats.dueOverdue, icon: AlertTriangle, color: "text-secondary" },
          { label: "Total Paid", value: `KES ${stats.totalPaid.toLocaleString()}`, icon: CheckCircle2, color: "text-primary" },
          { label: "Upcoming", value: stats.upcoming, icon: Clock },
          { label: "Total Cycles", value: stats.totalCycles, icon: CalendarDays },
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

      {/* Tabs */}
      <div className="flex rounded-lg border border-border bg-muted p-1 w-fit">
        {["Rent Schedule", "Payment History"].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}>{tab}</button>
        ))}
      </div>

      {/* Filter pills (schedule only) */}
      {activeTab === "Rent Schedule" && (
        <div className="flex gap-2 flex-wrap">
          {FILTER_PILLS.map((pill) => (
            <button key={pill} onClick={() => setFilter(pill)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                filter === pill ? "bg-primary text-primary-foreground" : "border border-border hover:border-primary"
              }`}>{pill} {pill !== "All" && payments.filter((p: Payment) => p.status === filterMap[pill]).length > 0
                ? `${payments.filter((p: Payment) => p.status === filterMap[pill]).length}` : ""}</button>
          ))}
        </div>
      )}

      {/* M-Pesa pay modal */}
      {payingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-background p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">M-Pesa Payment</p>
                <p className="text-xs text-muted-foreground">Enter your Safaricom number</p>
              </div>
            </div>
            <div className="rounded-lg bg-primary/5 border border-primary/10 p-4 mb-4 text-center">
              <p className="text-xs text-muted-foreground">AMOUNT TO PAY</p>
              <p className="text-3xl font-bold text-primary">
                KES {payments.find((p: Payment) => p.id === payingId)?.amount.toLocaleString()}
              </p>
            </div>
            {paymentStatus === "success" ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600 mb-3" />
                <h3 className="text-xl font-bold text-foreground">Payment Received</h3>
                <p className="text-sm text-muted-foreground mt-1">Your rent has been paid!</p>
              </div>
            ) : paymentStatus === "polling" ? (
              <div className="rounded-xl border border-border p-6 text-center space-y-4">
                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-primary" />
                <div>
                  <h3 className="font-bold text-lg">Waiting for M-Pesa</h3>
                  <p className="text-sm text-muted-foreground mt-1">Please enter your PIN on your phone to complete the payment.</p>
                </div>
                <Button variant="outline" className="w-full mt-4 border-dashed"
                  onClick={() => simulatePaymentMutation.mutate()} loading={simulatePaymentMutation.isPending}>
                  Simulate Payment Success (Dev Only)
                </Button>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Phone Number</label>
                  <div className="mt-1.5 flex gap-2">
                    <span className="flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm">🇰🇪 +254</span>
                    <Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="7XX XXX XXX" className="rounded-l-none" />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">A push notification will be sent to this number</p>
                </div>
                {paymentStatus === "timeout" && (
                  <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 mb-4">
                    Payment request timed out. Please try again.
                  </div>
                )}
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => { setPayingId(null); setPaymentStatus("idle"); }}>Cancel</Button>
                  <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                    loading={payMutation.isPending}
                    disabled={!phoneNumber}
                    onClick={() => payMutation.mutate({ id: payingId, phone: phoneNumber })}>
                    {payMutation.isPending ? "Processing..." : "Send STK Push"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Payments list */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />)}
        </div>
      ) : displayPayments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <CalendarDays className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-semibold">No schedules found</p>
          <p className="mt-1 text-sm text-muted-foreground">Rent schedules appear once your contract is active</p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayPayments.map((payment: any) => (
            <div key={payment.id} className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
              <div>
                <p className="text-sm font-medium">{payment.contract?.listing?.title}</p>
                <p className="text-xs text-muted-foreground">
                  Cycle {payment.cycleNumber} · Due: {format(new Date(payment.dueDate), "dd MMM yyyy")}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-semibold">KES {payment.amount.toLocaleString()}</p>
                  <span className={`text-xs font-medium ${
                    payment.status === "OVERDUE" ? "text-destructive" :
                    payment.status === "DUE_NOW" ? "text-secondary" :
                    payment.status === "PAID" ? "text-primary" : "text-muted-foreground"
                  }`}>{payment.status.replace("_", " ")}</span>
                </div>
                {payment.status !== "PAID" && (
                  <Button size="sm" onClick={() => setPayingId(payment.id)}
                    className="bg-primary text-primary-foreground hover:bg-primary/90">
                    Pay
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TenantPaymentsPage() {
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
