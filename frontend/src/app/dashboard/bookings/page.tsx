"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { Calendar, CheckCircle2, XCircle, Clock, Eye, Search, Filter, Key, Building2, X, FileText, DollarSign } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const TABS = [
  "ALL",
  "PENDING",
  "APPROVED",
  "UNIT_SELECTED",
  "CONTRACT_PREPARED",
  "CONTRACT_CONFIRMED",
  "COMPLETED",
  "REJECTED"
];

function BookingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "ALL");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");

  useEffect(() => {
    const params = new URLSearchParams();
    if (activeTab && activeTab !== "ALL") params.set("tab", activeTab);
    if (searchQuery) params.set("search", searchQuery);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [activeTab, searchQuery, pathname, router]);
  const [preparingBooking, setPreparingBooking] = useState<any>(null);
  
  // Contract Preparation form state
  const [prepUnitId, setPrepUnitId] = useState<string>("");
  const [prepRent, setPrepRent] = useState<string>("");
  const [prepDeposit, setPrepDeposit] = useState<string>("");
  const [prepStartDate, setPrepStartDate] = useState<string>("");
  const [prepDuration, setPrepDuration] = useState<number>(12);

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["landlord-bookings"],
    queryFn: () => api.get("/api/bookings/landlord") as Promise<{ bookings: any[]; stats: any }>,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/api/bookings/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landlord-bookings"] });
      toast.success("Booking request updated");
    },
    onError: (err) => {
      toast.error("Failed to update booking", { description: err instanceof ApiError ? (err.body as any)?.error : "Error" });
    },
  });

  const completeViewingMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/api/bookings/${id}/complete-viewing`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landlord-bookings"] });
      toast.success("Physical viewing marked as completed!");
    },
  });

  const prepareContractMutation = useMutation({
    mutationFn: (data: any) => api.post("/api/contracts/prepare", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landlord-bookings"] });
      toast.success("Tenancy agreement prepared and signed!", { description: "Sent to tenant for contract confirmation." });
      setPreparingBooking(null);
    },
    onError: (err) => {
      toast.error("Failed to prepare contract", { description: err instanceof ApiError ? (err.body as any)?.error : "Error" });
    },
  });

  const payContractMutation = useMutation({
    mutationFn: (contractId: string) => api.post(`/api/contracts/${contractId}/pay-initial`, { mpesaReceiptNo: "OFFLINE_PAYMENT" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landlord-bookings"] });
      toast.success("Payment recorded! Contract is now active and unit occupied.");
    },
  });

  const bookings = data?.bookings ?? [];
  const stats = data?.stats ?? { total: 0, needReview: 0, approved: 0 };

  const filtered = (activeTab === "ALL" ? bookings : bookings.filter((b: any) => b.status === activeTab))
    .filter((b: any) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return b.tenant?.fullName?.toLowerCase().includes(q) ||
             b.listing?.title?.toLowerCase().includes(q) ||
             b.unitType?.toLowerCase().includes(q);
    });

  function openPrepContractModal(booking: any) {
    setPreparingBooking(booking);
    setPrepUnitId(booking.unitId || "");
    const rent = booking.unit?.rentOverride || booking.unitTypeDetails?.monthlyRent || 0;
    const deposit = booking.unitTypeDetails?.securityDeposit || rent;
    setPrepRent(String(rent));
    setPrepDeposit(String(deposit));
    setPrepStartDate(new Date(booking.moveInDate).toISOString().split("T")[0]);
    setPrepDuration(booking.leaseDuration || 12);
  }

  function handleSaveContract() {
    if (!preparingBooking) return;
    prepareContractMutation.mutate({
      bookingId: preparingBooking.id,
      unitId: prepUnitId || preparingBooking.unitId,
      monthlyRent: prepRent,
      securityDeposit: prepDeposit,
      startDate: prepStartDate,
      leaseDuration: prepDuration,
    });
  }

  return (
    <div className="space-y-6">
      {/* Stage 5: Contract Preparation Modal */}
      {preparingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-background p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-lg">Stage 5: Prepare & Sign Tenancy Contract</h3>
              </div>
              <button onClick={() => setPreparingBooking(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-xl bg-primary/5 border border-primary/10 p-3.5 space-y-1 text-xs">
              <p className="font-bold text-foreground text-sm">{preparingBooking.tenant?.fullName}</p>
              <p className="text-muted-foreground">Property: <span className="font-medium text-foreground">{preparingBooking.listing?.title}</span></p>
              <p className="text-muted-foreground">Assigned Door / Unit: <span className="font-bold text-primary text-sm">Door {preparingBooking.unit?.unitNumber || "Unassigned"}</span></p>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <Label className="text-xs font-semibold uppercase text-muted-foreground">Monthly Rent (KES)</Label>
                <Input type="number" value={prepRent} onChange={(e) => setPrepRent(e.target.value)} className="mt-1" />
              </div>

              <div>
                <Label className="text-xs font-semibold uppercase text-muted-foreground">Security Deposit (KES)</Label>
                <Input type="number" value={prepDeposit} onChange={(e) => setPrepDeposit(e.target.value)} className="mt-1" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold uppercase text-muted-foreground">Start Date</Label>
                  <Input type="date" value={prepStartDate} onChange={(e) => setPrepStartDate(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs font-semibold uppercase text-muted-foreground">Duration (Months)</Label>
                  <Input type="number" value={prepDuration} onChange={(e) => setPrepDuration(parseInt(e.target.value))} className="mt-1" />
                </div>
              </div>
            </div>

            <div className="pt-3 flex gap-3 border-t border-border">
              <Button variant="outline" className="flex-1" onClick={() => setPreparingBooking(null)}>Cancel</Button>
              <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                loading={prepareContractMutation.isPending} onClick={handleSaveContract}>
                Sign & Send to Tenant →
              </Button>
            </div>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Bookings Management</h1>
        <p className="mt-1 text-muted-foreground">Manage tenant booking requests across the 7-stage process</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Bookings", value: stats.total, icon: Calendar },
          { label: "Need Review", value: stats.needReview, icon: Clock, color: "text-amber-600" },
          { label: "Approved / Active", value: stats.approved, icon: CheckCircle2, color: "text-primary" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{label}</p>
              <Icon className={`h-4 w-4 ${color || "text-muted-foreground"}`} />
            </div>
            <p className={`mt-2 text-2xl font-bold ${color || ""}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-card p-2 rounded-xl border border-border">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by property, tenant name, unit category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-4 rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === tab ? "bg-primary text-primary-foreground" : "border border-border hover:border-primary hover:text-primary"
            }`}>
            {tab.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Calendar className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 font-semibold">No bookings found</p>
          <p className="mt-1 text-sm text-muted-foreground">Bookings appear here once tenants request property viewings</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((booking: any) => (
            <div key={booking.id} className="rounded-xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-lg">{booking.tenant?.fullName}</p>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      booking.status === "COMPLETED" ? "bg-emerald-100 text-emerald-800" :
                      booking.status === "APPROVED" || booking.status === "UNIT_SELECTED" ? "bg-primary/10 text-primary" :
                      booking.status === "CONTRACT_PREPARED" || booking.status === "CONTRACT_CONFIRMED" ? "bg-blue-100 text-blue-800" :
                      booking.status === "PENDING" || booking.status === "NEED_REVIEW" ? "bg-amber-100 text-amber-800" :
                      "bg-destructive/10 text-destructive"
                    }`}>{booking.status.replace("_", " ")}</span>
                  </div>

                  <p className="mt-0.5 text-sm text-muted-foreground truncate">{booking.listing?.title}</p>

                  <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Category: {booking.unitType}</span>
                    {booking.unit && <span className="font-bold text-primary">Selected Unit: Door {booking.unit.unitNumber}</span>}
                    <span>Move-in: {format(new Date(booking.moveInDate), "dd MMM yyyy")}</span>
                    <span>Lease: {booking.leaseDuration} months</span>
                  </div>

                  <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                    <span>Email: {booking.tenant?.email}</span>
                    {booking.tenant?.phone && <span>Phone: {booking.tenant.phone}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  {/* Stage 2 Action: Approve Unit Type Booking for Viewing */}
                  {(booking.status === "PENDING" || booking.status === "NEED_REVIEW") && (
                    <>
                      <Button size="sm" onClick={() => statusMutation.mutate({ id: booking.id, status: "APPROVED" })}
                        className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90">
                        <CheckCircle2 className="h-4 w-4" /> Approve for Viewing (Stage 2)
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => statusMutation.mutate({ id: booking.id, status: "REJECTED" })}
                        className="gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10">
                        <XCircle className="h-3.5 w-3.5" /> Decline
                      </Button>
                    </>
                  )}

                  {/* Stage 3 Info: Tenant is viewing */}
                  {["APPROVED", "VIEWING_SCHEDULED"].includes(booking.status) && (
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline"
                        onClick={() => completeViewingMutation.mutate(booking.id)}
                        loading={completeViewingMutation.isPending}
                        className="gap-1.5 border-primary/40 text-primary hover:bg-primary/10">
                        <CheckCircle2 className="h-4 w-4" /> Mark Physical Viewing Completed (Stage 3)
                      </Button>
                      <div className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs text-primary font-medium">
                        Approved for Viewing — Waiting for Unit Selection
                      </div>
                    </div>
                  )}

                  {/* Stage 5 Action: Tenant selected unit, Landlord prepares contract */}
                  {booking.status === "UNIT_SELECTED" && (
                    <Button size="sm" onClick={() => openPrepContractModal(booking)}
                      className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90">
                      <FileText className="h-4 w-4" /> Prepare & Sign Contract (Stage 5)
                    </Button>
                  )}

                  {/* Stage 6 Info: Contract Prepared */}
                  {booking.status === "CONTRACT_PREPARED" && (
                    <div className="rounded-lg bg-blue-50 text-blue-700 px-3 py-1.5 text-xs font-medium">
                      Contract Sent — Waiting for Tenant Review & Signature
                    </div>
                  )}

                  {/* Stage 7 Action: Tenant confirmed contract, ready for payment */}
                  {booking.status === "CONTRACT_CONFIRMED" && booking.contract && (
                    <Button size="sm" onClick={() => payContractMutation.mutate(booking.contract.id)}
                      className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700">
                      <DollarSign className="h-4 w-4" /> Confirm Initial Payment (Stage 7)
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function BookingsPage() {
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
