"use client";

import { useState, useEffect, Suspense } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { CalendarCheck, Clock, CheckCircle2, XCircle, DollarSign, Eye, Home, Check, ChevronRight, FileText, AlertCircle, Phone, Loader2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useAuth } from "@/app/features/auth/hooks/use-auth";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

const STATUS_TABS = [
  "ALL",
  "PENDING",
  "APPROVED",
  "VIEWING_COMPLETED",
  "UNIT_SELECTED",
  "CONTRACT_PREPARED",
  "CONTRACT_CONFIRMED",
  "COMPLETED",
  "CANCELLED"
];

const STAGES = [
  { num: 1, key: "PENDING", label: "1. Unit Type Booking" },
  { num: 2, key: "APPROVED", label: "2. Booking Approved" },
  { num: 3, key: "VIEWING", label: "3. Physical Viewing" },
  { num: 4, key: "UNIT_SELECTED", label: "4. Unit Selected" },
  { num: 5, key: "CONTRACT_PREPARED", label: "5. Contract Prepared" },
  { num: 6, key: "CONTRACT_CONFIRMED", label: "6. Contract Confirmed" },
  { num: 7, key: "COMPLETED", label: "7. Paid & Active" },
];

function getStageNumber(status: string, hasUnit: boolean, contractStatus?: string): number {
  switch (status) {
    case "PENDING":
    case "NEED_REVIEW":
      return 1;
    case "APPROVED":
    case "VIEWING_SCHEDULED":
      return 3;
    case "VIEWING_COMPLETED":
      return 4; // viewing done → stage 4 is now active (Select Unit)
    case "UNIT_SELECTED":
      return 4;
    case "CONTRACT_PREPARED":
      return 5;
    case "CONTRACT_CONFIRMED":
      return 6;
    case "COMPLETED":
      return 7;
    default:
      return 1;
  }
}

function BookingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "ALL");
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [selectingBooking, setSelectingBooking] = useState<any>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Sync tab and search to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (activeTab && activeTab !== "ALL") params.set("tab", activeTab);
    if (search) params.set("search", search);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [activeTab, search, pathname, router]);

  const [payingBooking, setPayingBooking] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "polling" | "success" | "timeout">("idle");
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState(user?.phone?.replace(/^0/, "") ?? "");

  const { data, isLoading } = useQuery({
    queryKey: ["tenant-bookings"],
    queryFn: () => api.get("/api/bookings/tenant") as Promise<{ bookings: any[] }>,
  });

  const { data: incompleteData } = useQuery({
    queryKey: ["tenant-incomplete-bookings"],
    queryFn: () => api.get("/api/bookings/tenant/incomplete") as Promise<{ bookings: any[] }>,
  });

  const payMutation = useMutation({
    mutationFn: (phone: string) => api.post(`/api/bookings/${payingBooking.id}/pay`, { phone }),
    onSuccess: (res: any) => {
      setCheckoutRequestId(res.checkoutRequestId);
      setPaymentStatus("polling");
    },
    onError: (err) => {
      const message = err instanceof ApiError ? (err.body as any)?.error : "Payment initiation failed";
      toast.error("Error", { description: message });
      setPaymentStatus("idle");
    },
  });

  // Temporary hook for simulated payment confirmation
  const simulatePaymentMutation = useMutation({
    mutationFn: () => api.post(`/api/bookings/${payingBooking.id}/confirm-payment`, {
      mpesaReceiptNo: `SIM-${Date.now()}`,
      checkoutRequestId
    }),
    onSuccess: () => {
      setPaymentStatus("success");
      toast.success("Payment successful!");
      queryClient.invalidateQueries({ queryKey: ["tenant-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["tenant-incomplete-bookings"] });
      setTimeout(() => {
        setPayingBooking(null);
        setPaymentStatus("idle");
      }, 2000);
    }
  });

  useEffect(() => {
    if (paymentStatus !== "polling" || !payingBooking?.id) return;

    let timeoutId: NodeJS.Timeout;
    const pollInterval = setInterval(async () => {
      try {
        const res = await api.get(`/api/bookings/${payingBooking.id}`) as { booking: any };
        if (res.booking?.feePaid) {
          setPaymentStatus("success");
          clearInterval(pollInterval);
          toast.success("Payment successful!");
          queryClient.invalidateQueries({ queryKey: ["tenant-bookings"] });
          queryClient.invalidateQueries({ queryKey: ["tenant-incomplete-bookings"] });
          setTimeout(() => {
            setPayingBooking(null);
            setPaymentStatus("idle");
          }, 2000);
        }
      } catch (err) {
        console.error("Polling error", err);
      }
    }, 5000);

    timeoutId = setTimeout(() => {
      clearInterval(pollInterval);
      if (paymentStatus === "polling") {
        setPaymentStatus("timeout");
        toast.error("Payment timed out");
      }
    }, 120000);

    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeoutId);
    };
  }, [paymentStatus, payingBooking?.id, queryClient]);

  const { data: unitsData, isLoading: isLoadingUnits } = useQuery({
    queryKey: ["available-units", selectingBooking?.id],
    queryFn: () => api.get(`/api/bookings/${selectingBooking.id}/available-units`) as Promise<{ units: any[]; unitType: any }>,
    enabled: !!selectingBooking,
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/api/bookings/${id}/cancel`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-bookings"] });
      toast.success("Booking cancelled");
    },
  });

  const completeViewingMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/api/bookings/${id}/complete-viewing`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-bookings"] });
      toast.success("Physical viewing marked as completed!", { description: "You can now pick your specific unit." });
    },
  });

  const selectUnitMutation = useMutation({
    mutationFn: ({ bookingId, unitId }: { bookingId: string; unitId: string }) =>
      api.patch(`/api/bookings/${bookingId}/select-unit`, { unitId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-bookings"] });
      toast.success("Specific unit selected!", { description: "The landlord has been notified to prepare your tenancy contract." });
      setSelectingBooking(null);
      setSelectedUnitId("");
    },
    onError: (err) => {
      const message = err instanceof ApiError ? (err.body as any)?.error : "Failed to select unit";
      toast.error("Error", { description: message });
    },
  });

  const incompleteBookings = incompleteData?.bookings ?? [];
  const bookings = data?.bookings ?? [];
  const filtered = bookings.filter((b: any) => {
    const matchTab = activeTab === "ALL" || b.status === activeTab;
    const matchSearch = !search || b.listing?.title?.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const stats = {
    total: bookings.length,
    awaiting: bookings.filter((b: any) => ["PENDING", "NEED_REVIEW"].includes(b.status)).length,
    approved: bookings.filter((b: any) => ["APPROVED", "VIEWING_SCHEDULED", "UNIT_SELECTED"].includes(b.status)).length,
    totalPaid: bookings.filter((b: any) => b.feePaid).length * 1000,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Bookings</h1>
        <p className="mt-1 text-muted-foreground">Track your 7-stage property booking requests and select your unit</p>
      </div>

      {incompleteBookings.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-800">Incomplete Payments ({incompleteBookings.length})</p>
              <p className="text-sm text-amber-700 mt-1">
                You have bookings awaiting the KES 1,000 commitment fee. They are not visible to the landlord yet.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 shrink-0 w-full sm:w-auto">
            {incompleteBookings.map((b: any) => (
              <Button key={b.id} onClick={() => setPayingBooking(b)} className="bg-amber-600 text-white hover:bg-amber-700 whitespace-nowrap">
                Pay for {b.listing?.title} →
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* M-Pesa Modal */}
      {payingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-background p-6 shadow-xl relative overflow-hidden">
            {paymentStatus === "success" ? (
              <div className="text-center py-6">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mb-4">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Payment Received</h3>
              </div>
            ) : paymentStatus === "polling" ? (
              <div className="text-center py-6">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4 animate-pulse">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Waiting for M-Pesa</h3>
                <p className="mt-2 text-sm text-muted-foreground px-4">
                  Please check your phone and enter your M-Pesa PIN.
                </p>
                <Button variant="outline" size="sm" className="mt-6"
                  onClick={() => simulatePaymentMutation.mutate()} loading={simulatePaymentMutation.isPending}>
                  Simulate Payment Success (Dev Only)
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Complete Booking Fee</p>
                    <p className="text-xs text-muted-foreground">{payingBooking.listing?.title}</p>
                  </div>
                </div>

                <div className="rounded-xl bg-primary/5 border border-primary/10 p-4 text-center mb-5">
                  <p className="text-3xl font-bold text-primary">KES 1,000</p>
                </div>

                {paymentStatus === "timeout" && (
                  <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-red-600 text-xs">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <p>The request timed out. Try again.</p>
                  </div>
                )}

                <div className="mb-4">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Phone Number</Label>
                  <div className="mt-1.5 flex">
                    <span className="flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm">🇰🇪 +254</span>
                    <Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="7XX XXX XXX" className="rounded-l-none" />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => { setPayingBooking(null); setPaymentStatus("idle"); }}>Cancel</Button>
                  <Button className="flex-1 bg-primary text-primary-foreground" loading={payMutation.isPending} disabled={!phoneNumber} onClick={() => payMutation.mutate(phoneNumber)}>
                    {payMutation.isPending ? "Sending..." : "Send STK Push"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Bookings", value: stats.total, icon: CalendarCheck },
          { label: "Awaiting Action", value: stats.awaiting, icon: Clock, color: "text-secondary" },
          { label: "Approved / Viewing", value: stats.approved, icon: CheckCircle2, color: "text-primary" },
          { label: "Total Fees Paid", value: `KSh ${stats.totalPaid.toLocaleString()}`, icon: DollarSign, color: "text-primary" },
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

      {/* Search + tabs */}
      <Input value={search} onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by property, location, or unit type..." />

      <div className="flex gap-2 flex-wrap">
        {STATUS_TABS.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === tab ? "bg-primary text-primary-foreground" : "border border-border hover:border-primary hover:text-primary"
            }`}>
            {tab.replace("_", " ")}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <CalendarCheck className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 font-semibold">No bookings found</p>
          <p className="mt-1 text-sm text-muted-foreground">Start by browsing available properties</p>
          <Link href="/browse">
            <Button className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90">Browse Properties</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((booking: any) => {
            const currentStage = getStageNumber(booking.status, !!booking.unit, booking.contract?.status);

            return (
              <div key={booking.id} className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm">
                {/* Property info header */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-lg">{booking.listing?.title}</p>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        booking.status === "COMPLETED" ? "bg-emerald-100 text-emerald-800" :
                        booking.status === "VIEWING_COMPLETED" ? "bg-teal-100 text-teal-800" :
                        booking.status === "APPROVED" || booking.status === "VIEWING_SCHEDULED" || booking.status === "UNIT_SELECTED" ? "bg-primary/10 text-primary" :
                        booking.status === "CONTRACT_PREPARED" || booking.status === "CONTRACT_CONFIRMED" ? "bg-blue-100 text-blue-800" :
                        booking.status === "PENDING" || booking.status === "NEED_REVIEW" ? "bg-amber-100 text-amber-800" :
                        booking.status === "CANCELLED" ? "bg-destructive/10 text-destructive" :
                        "bg-muted text-muted-foreground"
                      }`}>{booking.status.replaceAll("_", " ")}</span>
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">{booking.listing?.address}</p>
                    <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span>Category: <strong className="text-foreground">{booking.unitType}</strong></span>
                      {booking.unit && (
                        <span>Unit: <strong className="text-primary font-bold">Door {booking.unit.unitNumber} · Floor {booking.unit.floor}</strong></span>
                      )}
                      <span>Move-in: <strong className="text-foreground">{format(new Date(booking.moveInDate), "dd MMM yyyy")}</strong></span>
                      <span>Lease: {booking.leaseDuration} months</span>
                    </div>
                  </div>

                  {/* Cancel button — only for pending */}
                  {["PENDING", "NEED_REVIEW"].includes(booking.status) && (
                    <Button size="sm" variant="outline"
                      onClick={() => confirm("Cancel this booking?") && cancelMutation.mutate(booking.id)}
                      className="border-destructive/30 text-destructive hover:bg-destructive/10 gap-1.5 shrink-0">
                      <XCircle className="h-3.5 w-3.5" /> Cancel
                    </Button>
                  )}
                </div>

                {/* ── 7-Stage Progress Stepper with embedded Next-Step CTA ── */}
                <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Booking Progress</p>
                    <p className="text-[11px] font-bold text-primary">Stage {currentStage} of 7</p>
                  </div>

                  {/* Stepper circles + connector */}
                  <div className="relative flex items-center justify-between">
                    <div className="absolute left-0 right-0 top-[14px] h-0.5 bg-border mx-[14px]" />
                    <div
                      className="absolute left-[14px] top-[14px] h-0.5 bg-primary transition-all duration-500"
                      style={{ width: `calc(${((currentStage - 1) / 6) * 100}% * (100% - 28px) / 100%)` }}
                    />
                    {STAGES.map((s) => {
                      const isPast = currentStage > s.num;
                      const isCurrent = currentStage === s.num;
                      return (
                        <div key={s.num} className="relative z-10 flex flex-col items-center gap-1">
                          <div className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-[11px] font-extrabold transition-all duration-300 ${
                            isPast
                              ? "bg-primary border-primary text-primary-foreground"
                              : isCurrent
                              ? "bg-background border-primary text-primary shadow-[0_0_0_4px_hsl(var(--primary)/0.18)]"
                              : "bg-background border-border text-muted-foreground"
                          }`}>
                            {isPast ? <Check className="h-3.5 w-3.5" /> : s.num}
                          </div>
                          <span className={`text-[9px] leading-tight text-center w-12 ${
                            isCurrent ? "font-bold text-primary" :
                            isPast ? "text-muted-foreground" :
                            "text-muted-foreground/40"
                          }`}>
                            {s.label.split(". ")[1]}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* ── NEXT STEP ACTION BLOCK ── */}
                  {booking.status !== "COMPLETED" && booking.status !== "CANCELLED" && (() => {
                    if (["PENDING", "NEED_REVIEW"].includes(booking.status)) {
                      return (
                        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5">
                          <span className="text-2xl shrink-0">⏳</span>
                          <div>
                            <p className="text-sm font-semibold text-amber-900">Next Step: Await Landlord Approval</p>
                            <p className="text-xs text-amber-700 mt-0.5">Your booking request has been sent. The landlord will approve or decline it.</p>
                          </div>
                        </div>
                      );
                    }
                    if (["APPROVED", "VIEWING_SCHEDULED"].includes(booking.status)) {
                      return (
                        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 space-y-3">
                          <div className="flex items-start gap-3">
                            <span className="text-2xl shrink-0">📅</span>
                            <div>
                              <p className="text-sm font-semibold text-foreground">Next Step: Visit the Property & Complete Viewing</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Physically visit the property to inspect the available <strong>{booking.unitType}</strong> units. Once done, click below.
                              </p>
                            </div>
                          </div>
                          <Button className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                            onClick={() => completeViewingMutation.mutate(booking.id)}
                            loading={completeViewingMutation.isPending}>
                            <CheckCircle2 className="h-4 w-4" />
                            Mark Physical Viewing as Completed →
                          </Button>
                        </div>
                      );
                    }
                    if (booking.status === "VIEWING_COMPLETED") {
                      return (
                        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 space-y-3">
                          <div className="flex items-start gap-3">
                            <span className="text-2xl shrink-0">🏠</span>
                            <div>
                              <p className="text-sm font-semibold text-foreground">Next Step: Select Your Specific Unit</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Physical viewing complete! Now pick the exact door number you inspected and wish to rent.
                              </p>
                            </div>
                          </div>
                          <Button className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                            onClick={() => { setSelectingBooking(booking); setSelectedUnitId(booking.unitId || ""); }}>
                            <Home className="h-4 w-4" />
                            Select Your Unit → Choose Door Number
                          </Button>
                        </div>
                      );
                    }
                    if (booking.status === "UNIT_SELECTED") {
                      return (
                        <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-3.5">
                          <span className="text-2xl shrink-0">📄</span>
                          <div>
                            <p className="text-sm font-semibold text-foreground">Next Step: Await Tenancy Contract</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Unit <strong>Door {booking.unit?.unitNumber}</strong> selected! The landlord is now preparing your tenancy agreement.
                            </p>
                          </div>
                        </div>
                      );
                    }
                    if (["CONTRACT_PREPARED", "CONTRACT_CONFIRMED"].includes(booking.status)) {
                      return (
                        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3.5 space-y-3">
                          <div className="flex items-start gap-3">
                            <span className="text-2xl shrink-0">✍️</span>
                            <div>
                              <p className="text-sm font-semibold text-blue-900">Next Step: Review & Sign Your Contract</p>
                              <p className="text-xs text-blue-700 mt-0.5">Your tenancy contract is ready. Review the terms and sign to confirm your tenancy.</p>
                            </div>
                          </div>
                          <Link href="/tenant/contracts" className="block">
                            <Button className="w-full gap-2 bg-blue-600 text-white hover:bg-blue-700 font-semibold">
                              <FileText className="h-4 w-4" />
                              Open & Sign Contract →
                            </Button>
                          </Link>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
            );
          })}
        </div>
      )}


      {/* STAGE 4: Unit Selection Modal */}
      {selectingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-background shadow-2xl max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border p-5 pb-4">
              <div>
                <h3 className="font-bold text-lg">Stage 4: Select Your Unit</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Category: <strong className="text-foreground">{selectingBooking.unitType}</strong>
                </p>
              </div>
              <button onClick={() => setSelectingBooking(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors text-lg font-bold">✕</button>
            </div>

            {/* Instructions banner */}
            <div className="mx-5 mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3.5 flex items-start gap-3">
              <span className="text-xl mt-0.5">🏠</span>
              <div>
                <p className="text-sm font-semibold text-amber-900">Select the unit you chose during your physical viewing</p>
                <p className="text-xs text-amber-800 mt-0.5">
                  All units below are <strong className="text-emerald-700">vacant and ready to move in</strong>.
                  Choose the exact <strong>door number</strong> you inspected during your visit.
                </p>
              </div>
            </div>

            {/* Units list */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {isLoadingUnits ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
                  ))}
                </div>
              ) : (unitsData?.units || []).length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-border rounded-xl">
                  <Home className="mx-auto h-10 w-10 text-muted-foreground" />
                  <p className="mt-3 text-sm font-semibold">No vacant units currently available</p>
                  <p className="text-xs text-muted-foreground mt-1">Please contact the landlord directly for assistance.</p>
                </div>
              ) : (
                <>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {(unitsData?.units || []).length} vacant unit{(unitsData?.units || []).length !== 1 ? "s" : ""} available — tap your door number
                  </p>
                  <div className="space-y-2">
                    {(unitsData?.units || []).map((u: any) => {
                      const isSelected = selectedUnitId === u.id;
                      const price = u.rentOverride || unitsData?.unitType?.monthlyRent;
                      return (
                        <button
                          key={u.id}
                          onClick={() => setSelectedUnitId(u.id)}
                          className={`w-full flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all ${
                            isSelected
                              ? "border-primary bg-primary/5 shadow-md"
                              : "border-border hover:border-primary/60 hover:bg-muted/30"
                          }`}>
                          {/* Door number badge */}
                          <div className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl font-extrabold transition-colors ${
                            isSelected ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                          }`}>
                            <span className="text-[10px] font-semibold uppercase tracking-wide leading-none mb-0.5 opacity-70">Door</span>
                            <span className="text-lg leading-tight">{u.unitNumber}</span>
                          </div>

                          {/* Unit info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold text-foreground">Door / Unit {u.unitNumber}</p>
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                                Available
                              </span>
                              {isSelected && (
                                <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground uppercase tracking-wide">
                                  ✓ Your Choice
                                </span>
                              )}
                            </div>
                            <div className="flex gap-3 mt-0.5 text-xs text-muted-foreground">
                              <span>Floor {u.floor}</span>
                              {price && <span>KSh {price.toLocaleString()}/mo</span>}
                            </div>
                          </div>

                          {/* Selection indicator */}
                          <div className={`h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${
                            isSelected ? "border-primary bg-primary" : "border-border"
                          }`}>
                            {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 p-5 pt-3 border-t border-border">
              <Button variant="outline" className="flex-1" onClick={() => setSelectingBooking(null)}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                disabled={!selectedUnitId || selectUnitMutation.isPending}
                loading={selectUnitMutation.isPending}
                onClick={() => selectUnitMutation.mutate({ bookingId: selectingBooking.id, unitId: selectedUnitId })}>
                Confirm My Unit →
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TenantBookingsPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    }>
      <BookingsContent />
    </Suspense>
  );
}
