"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { FileText, CheckCircle2, Clock, Lock, PenLine, DollarSign, X, Phone, ShieldCheck } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function TenantContractsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [reviewingContract, setReviewingContract] = useState<any>(null);
  const [payingContract, setPayingContract] = useState<any>(null);
  const [phone, setPhone] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "polling" | "success" | "timeout">("idle");

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["tenant-contracts"],
    queryFn: () => api.get("/api/contracts/tenant") as Promise<{ contracts: any[]; stats: any }>,
  });

  const signMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/api/contracts/${id}/sign`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-contracts"] });
      toast.success("Tenancy Agreement confirmed and signed!", { description: "You can now proceed to make your initial rent and deposit payment." });
      setReviewingContract(null);
    },
    onError: (err) => {
      toast.error("Failed to sign contract", { description: err instanceof ApiError ? (err.body as any)?.error : "Error" });
    },
  });

  const payMutation = useMutation({
    mutationFn: ({ contractId, phone }: { contractId: string; phone: string }) =>
      api.post(`/api/contracts/${contractId}/pay-initial`, { phone }),
    onSuccess: () => {
      setPaymentStatus("polling");
      toast.success("STK Push sent!", { description: "Please check your phone for the M-Pesa prompt." });
    },
    onError: (err) => {
      toast.error("Payment initiation failed", { description: err instanceof ApiError ? (err.body as any)?.error : "Error" });
      setPaymentStatus("idle");
    },
  });

  const simulatePaymentMutation = useMutation({
    mutationFn: () => api.post(`/api/contracts/${payingContract.id}/confirm-payment`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-contracts"] });
      setPaymentStatus("success");
      toast.success("Initial payment completed!", { description: "Your tenancy contract is active and your unit is now officially occupied." });
      setTimeout(() => {
        setPayingContract(null);
        setPaymentStatus("idle");
      }, 3000);
    },
  });

  useEffect(() => {
    if (paymentStatus !== "polling" || !payingContract?.id) return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await api.get(`/api/contracts/${payingContract.id}`) as { contract: any };
        if (res.contract?.status === "ACTIVE") {
          setPaymentStatus("success");
          clearInterval(pollInterval);
          toast.success("Initial payment completed!", { description: "Your tenancy contract is active and your unit is now officially occupied." });
          queryClient.invalidateQueries({ queryKey: ["tenant-contracts"] });
          setTimeout(() => {
            setPayingContract(null);
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
  }, [paymentStatus, payingContract?.id, queryClient]);

  const contracts = data?.contracts ?? [];
  const stats = data?.stats ?? { total: 0, active: 0, pending: 0, locked: 0 };

  const filtered = contracts.filter((c: any) => {
    const matchStatus = !statusFilter || c.status === statusFilter;
    const matchSearch = !search || c.listing?.title?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Stage 6: Tenant Contract Verification Modal */}
      {reviewingContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-background p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-lg">Stage 6: Review & Confirm Tenancy Agreement</h3>
              </div>
              <button onClick={() => setReviewingContract(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contract Details Verification</p>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Property</p>
                  <p className="font-semibold">{reviewingContract.listing?.title}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Assigned Door / Unit #</p>
                  <p className="font-bold text-primary">Unit {reviewingContract.unit?.unitNumber || "Door " + reviewingContract.unitNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Monthly Rent</p>
                  <p className="font-bold">KSh {reviewingContract.monthlyRent?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Security Deposit</p>
                  <p className="font-bold">KSh {reviewingContract.securityDeposit?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Lease Start Date</p>
                  <p className="font-semibold">{format(new Date(reviewingContract.startDate), "dd MMMM yyyy")}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Lease End Date</p>
                  <p className="font-semibold">{format(new Date(reviewingContract.endDate), "dd MMMM yyyy")}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-border text-xs text-muted-foreground">
                Landlord: <strong className="text-foreground">{reviewingContract.landlord?.fullName}</strong> ({reviewingContract.landlord?.email})
              </div>
            </div>

            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 space-y-1">
              <p className="font-semibold">⚠️ Legal Confirmation</p>
              <p>By signing, you confirm that all details above (door number, rent, deposit, terms) are accurate and acceptable.</p>
            </div>

            <div className="pt-3 flex gap-3 border-t border-border">
              <Button variant="outline" className="flex-1" onClick={() => setReviewingContract(null)}>Cancel</Button>
              <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                loading={signMutation.isPending}
                onClick={() => signMutation.mutate(reviewingContract.id)}>
                Sign & Confirm Agreement →
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Stage 7: Initial Payment Modal */}
      {payingContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-background p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-lg">Stage 7: Initial Rent & Deposit Payment</h3>
              </div>
              <button onClick={() => setPayingContract(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-xl bg-primary/10 border border-primary/20 p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase">Total Initial Payable</p>
              <p className="text-3xl font-extrabold text-primary mt-1">
                KSh {(payingContract.monthlyRent + payingContract.securityDeposit).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Rent (KSh {payingContract.monthlyRent.toLocaleString()}) + Deposit (KSh {payingContract.securityDeposit.toLocaleString()})</p>
            </div>

            {paymentStatus === "success" ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600 mb-3" />
                <h3 className="text-xl font-bold text-foreground">Payment Received</h3>
                <p className="text-sm text-muted-foreground mt-1">Your tenancy contract is active!</p>
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
                <div>
                  <Label className="text-xs font-semibold uppercase text-muted-foreground">M-Pesa Phone Number</Label>
                  <div className="mt-1 flex">
                    <span className="flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground whitespace-nowrap">
                      🇰🇪 +254
                    </span>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)}
                      placeholder="7XX XXX XXX" className="rounded-l-none" />
                  </div>
                </div>

                {paymentStatus === "timeout" && (
                  <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                    Payment request timed out. Please try again.
                  </div>
                )}

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => { setPayingContract(null); setPaymentStatus("idle"); }}>Cancel</Button>
                  <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                    loading={payMutation.isPending} disabled={!phone}
                    onClick={() => payMutation.mutate({ contractId: payingContract.id, phone })}>
                    {payMutation.isPending ? "Sending..." : "Send STK Push"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Contracts</h1>
        <p className="mt-1 text-muted-foreground">Verify details, sign agreements, and activate your tenancy lease</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Contracts", value: stats.total, icon: FileText },
          { label: "Active", value: stats.active, icon: CheckCircle2, color: "text-primary" },
          { label: "Pending Signatures", value: stats.pending, icon: Clock, color: "text-amber-600" },
          { label: "Locked", value: stats.locked, icon: Lock, color: "text-blue-500" },
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

      {/* Filters */}
      <div className="flex gap-3">
        <Input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by property name, location..." className="flex-1 max-w-sm" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm">
          <option value="">All Status</option>
          {["PENDING", "AWAITING_PAYMENT", "ACTIVE", "EXPIRED", "TERMINATED"].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 font-semibold">No contracts found</p>
          <p className="mt-1 text-sm text-muted-foreground">Your tenancy agreements will appear here once prepared by the landlord</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((contract: any) => (
            <div key={contract.id} className="rounded-xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-lg">{contract.listing?.title}</p>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      contract.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800" :
                      contract.status === "AWAITING_PAYMENT" ? "bg-blue-100 text-blue-800" :
                      contract.status === "PENDING" ? "bg-amber-100 text-amber-800" :
                      "bg-muted text-muted-foreground"
                    }`}>{contract.status.replace("_", " ")}</span>
                  </div>

                  <p className="mt-0.5 text-sm text-muted-foreground">{contract.listing?.address}</p>

                  <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span>Assigned Unit: <strong className="text-primary font-bold">Door {contract.unit?.unitNumber || contract.unitNumber}</strong></span>
                    <span>Rent: KSh {contract.monthlyRent.toLocaleString()}/mo</span>
                    <span>Deposit: KSh {contract.securityDeposit.toLocaleString()}</span>
                    <span>Start: {format(new Date(contract.startDate), "dd MMM yyyy")}</span>
                  </div>

                  <div className="mt-2 flex gap-3 text-xs">
                    <span className={`flex items-center gap-1 ${contract.signedByTenant ? "text-primary font-medium" : "text-muted-foreground"}`}>
                      <CheckCircle2 className="h-3.5 w-3.5" /> Tenant confirmed & signed
                    </span>
                    <span className={`flex items-center gap-1 ${contract.signedByLandlord ? "text-primary font-medium" : "text-muted-foreground"}`}>
                      <CheckCircle2 className="h-3.5 w-3.5" /> Landlord signed
                    </span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  {/* Stage 6 Action: Review & Sign Contract */}
                  {contract.status === "PENDING" && !contract.signedByTenant && (
                    <Button size="sm" onClick={() => setReviewingContract(contract)}
                      className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
                      <PenLine className="h-4 w-4" /> Verify & Sign Contract (Stage 6)
                    </Button>
                  )}

                  {/* Stage 7 Action: Proceed to Payment */}
                  {contract.status === "AWAITING_PAYMENT" && (
                    <Button size="sm" onClick={() => setPayingContract(contract)}
                      className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700 font-semibold">
                      <DollarSign className="h-4 w-4" /> Make Initial Payment (Stage 7)
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
