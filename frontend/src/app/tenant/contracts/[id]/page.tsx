"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import {
  FileText, Calendar, DollarSign, Home, User, CheckCircle2,
  ArrowLeft, PenLine, MessageSquare, Phone, Loader2, ShieldCheck, AlertCircle, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import Link from "next/link";
import { toast } from "sonner";

const STATUS_META: Record<string, { label: string; color: string; description: string }> = {
  PENDING: {
    label: "Awaiting Your Signature",
    color: "bg-amber-100 text-amber-800 border-amber-200",
    description: "Your landlord has prepared a tenancy agreement. Please review and sign to proceed.",
  },
  AWAITING_PAYMENT: {
    label: "Awaiting Initial Payment",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    description: "Contract signed! Pay first month's rent + deposit to activate your tenancy.",
  },
  ACTIVE: {
    label: "Active Tenancy",
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
    description: "Your tenancy is active. Pay rent on time to maintain your good standing.",
  },
  EXPIRED: {
    label: "Lease Expired",
    color: "bg-muted text-muted-foreground border-border",
    description: "This tenancy lease has ended.",
  },
  TERMINATED: {
    label: "Terminated",
    color: "bg-red-100 text-red-800 border-red-200",
    description: "This tenancy was terminated before the lease end date.",
  },
};

export default function TenantContractDetail() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params?.id as string;

  const [payingContract, setPayingContract] = useState(false);
  const [reviewingContract, setReviewingContract] = useState(false);
  const [phone, setPhone] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "polling" | "success">("idle");

  const { data, isLoading } = useQuery({
    queryKey: ["tenant-contract", id],
    queryFn: () => api.get(`/api/contracts/${id}`) as Promise<{ contract: any }>,
  });

  const signMutation = useMutation({
    mutationFn: () => api.patch(`/api/contracts/${id}/sign`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-contract", id] });
      queryClient.invalidateQueries({ queryKey: ["tenant-contracts"] });
      toast.success("Contract signed!", { description: "You can now proceed to make your initial payment." });
      setReviewingContract(false);
    },
    onError: (err) => toast.error("Failed to sign", { description: err instanceof ApiError ? (err.body as any)?.error : "Error" }),
  });

  const payMutation = useMutation({
    mutationFn: () => api.post(`/api/contracts/${id}/pay-initial`, { phone }),
    onSuccess: () => {
      setPaymentStatus("polling");
      toast.success("STK Push sent!", { description: "Enter your M-Pesa PIN to complete payment." });
    },
    onError: (err) => toast.error("Payment failed", { description: err instanceof ApiError ? (err.body as any)?.error : "Error" }),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const contract = data?.contract;

  if (!contract) {
    return (
      <div className="text-center py-20 space-y-4">
        <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-bold">Contract not found</h2>
        <p className="text-sm text-muted-foreground">This contract may have been removed or you may not have access.</p>
        <Button onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Contracts
        </Button>
      </div>
    );
  }

  const meta = STATUS_META[contract.status] ?? STATUS_META["EXPIRED"];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">

      {/* Header with labeled back button */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.back()} className="gap-2 text-xs">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Contracts
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Contract Details</h1>
            <p className="text-xs text-muted-foreground">{contract.listing?.title}</p>
          </div>
        </div>
        {/* Status badge with explanation */}
        <div className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold ${meta.color}`}>
          <ShieldCheck className="h-3.5 w-3.5" />
          {meta.label}
        </div>
      </div>

      {/* Status explanation banner + primary CTA */}
      {contract.status === "PENDING" && !contract.signedByTenant && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <PenLine className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-900 text-sm">⚡ Action Required: Review & Sign Your Contract</p>
              <p className="text-xs text-amber-700 mt-0.5">{meta.description}</p>
            </div>
          </div>
          <Button onClick={() => setReviewingContract(true)}
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-bold shrink-0">
            <PenLine className="h-4 w-4" /> Review & Sign Contract →
          </Button>
        </div>
      )}

      {contract.status === "AWAITING_PAYMENT" && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <DollarSign className="h-5 w-5 text-blue-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-blue-900 text-sm">⚡ Action Required: Make Initial Payment</p>
              <p className="text-xs text-blue-700 mt-0.5">
                Pay KSh {(contract.monthlyRent + contract.securityDeposit).toLocaleString()} (Rent + Deposit) to activate your tenancy.
              </p>
            </div>
          </div>
          <Button onClick={() => setPayingContract(true)}
            className="gap-2 bg-blue-600 text-white hover:bg-blue-700 font-bold shrink-0">
            <DollarSign className="h-4 w-4" /> Make Initial Payment →
          </Button>
        </div>
      )}

      {contract.status === "ACTIVE" && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <p className="text-sm font-semibold text-emerald-800">{meta.description}</p>
          <Link href="/tenant/payments" className="ml-auto shrink-0">
            <Button size="sm" className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700 font-semibold">
              View Payment Schedule →
            </Button>
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Lease Terms */}
        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-base flex items-center gap-2 border-b pb-3">
            <FileText className="h-5 w-5 text-primary" /> Lease Terms
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Start Date</span>
              <span className="font-semibold">{format(new Date(contract.startDate), "dd MMM yyyy")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> End Date</span>
              <span className="font-semibold">{format(new Date(contract.endDate), "dd MMM yyyy")}</span>
            </div>
            <div className="flex justify-between border-t pt-3">
              <span className="text-muted-foreground">Monthly Rent</span>
              <span className="font-bold text-primary">KSh {contract.monthlyRent?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Security Deposit</span>
              <span className="font-semibold">KSh {contract.securityDeposit?.toLocaleString()}</span>
            </div>
          </div>
          <div className="flex gap-2 pt-1 text-xs">
            <span className={`flex items-center gap-1 ${contract.signedByTenant ? "text-primary font-semibold" : "text-muted-foreground"}`}>
              <CheckCircle2 className="h-3.5 w-3.5" /> Tenant signed
            </span>
            <span className={`flex items-center gap-1 ${contract.signedByLandlord ? "text-primary font-semibold" : "text-muted-foreground"}`}>
              <CheckCircle2 className="h-3.5 w-3.5" /> Landlord signed
            </span>
          </div>
        </div>

        {/* Property & Landlord */}
        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-base flex items-center gap-2 border-b pb-3">
            <Home className="h-5 w-5 text-primary" /> Property & Landlord
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Property</span>
              <span className="font-semibold">{contract.listing?.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Address</span>
              <span className="font-medium text-right max-w-[60%]">{contract.listing?.address}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Unit Type</span>
              <span className="font-medium">{contract.unitType?.label}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Assigned Door</span>
              <span className="font-bold text-primary">Unit {contract.unit?.unitNumber || contract.unitNumber}</span>
            </div>
            <div className="flex justify-between items-center border-t pt-3">
              <span className="text-muted-foreground flex items-center gap-1"><User className="h-4 w-4" /> Landlord</span>
              <span className="font-semibold">{contract.landlord?.fullName}</span>
            </div>
          </div>
          {/* Message landlord shortcut */}
          <Link href="/tenant/inbox" className="block">
            <Button variant="outline" size="sm" className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/5">
              <MessageSquare className="h-4 w-4" /> Message Landlord
            </Button>
          </Link>
        </div>
      </div>

      {/* Payment Ledger with inline Pay buttons */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="bg-muted/50 p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold text-base flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" /> Payment Ledger
          </h3>
          <span className="text-xs text-muted-foreground">
            {contract.rentPayments?.filter((p: any) => p.status === "PAID").length || 0} of {contract.rentPayments?.length || 0} paid
          </span>
        </div>
        <div className="p-4">
          {!contract.rentPayments?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="mx-auto h-8 w-8 mb-2 text-muted-foreground/60" />
              <p className="text-sm font-semibold">No payment schedule yet</p>
              <p className="text-xs mt-1">Rent cycles will appear here once your tenancy is activated.</p>
            </div>
          ) : (
            <div className="divide-y">
              {contract.rentPayments?.map((payment: any) => (
                <div key={payment.id} className="py-3 flex justify-between items-center gap-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm">Cycle {payment.cycleNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      Due: {format(new Date(payment.dueDate), "dd MMM yyyy")}
                    </p>
                    {payment.paidDate && (
                      <p className="text-xs text-primary font-medium">
                        Paid: {format(new Date(payment.paidDate), "dd MMM yyyy")}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="font-bold text-sm">KSh {payment.amount?.toLocaleString()}</p>
                      <span className={`text-xs font-bold ${
                        payment.status === "PAID" ? "text-emerald-600" :
                        payment.status === "OVERDUE" ? "text-red-600" :
                        payment.status === "DUE_NOW" ? "text-amber-600" :
                        "text-muted-foreground"
                      }`}>
                        {payment.status.replace("_", " ")}
                      </span>
                    </div>
                    {payment.status !== "PAID" && payment.status !== "UPCOMING" && (
                      <Link href="/tenant/payments">
                        <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold">
                          Pay Now
                        </Button>
                      </Link>
                    )}
                    {payment.status === "PAID" && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sign Contract Modal */}
      {reviewingContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-background p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 border-b pb-3">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h3 className="font-bold text-lg">Confirm & Sign Agreement</h3>
            </div>
            <div className="rounded-xl bg-muted/40 p-4 text-sm space-y-2">
              <div className="flex justify-between"><span className="text-muted-foreground">Property</span><span className="font-semibold">{contract.listing?.title}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Unit</span><span className="font-bold text-primary">Unit {contract.unit?.unitNumber || contract.unitNumber}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Monthly Rent</span><span className="font-bold">KSh {contract.monthlyRent?.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Deposit</span><span className="font-semibold">KSh {contract.securityDeposit?.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Lease Period</span><span className="font-semibold">{format(new Date(contract.startDate), "dd MMM yyyy")} → {format(new Date(contract.endDate), "dd MMM yyyy")}</span></div>
            </div>
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
              ⚠️ By signing, you confirm all details above are correct and you agree to the tenancy terms.
            </div>
            <div className="flex gap-3 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setReviewingContract(false)}>Cancel</Button>
              <Button className="flex-1 bg-primary text-primary-foreground font-bold"
                loading={signMutation.isPending} onClick={() => signMutation.mutate()}>
                Sign & Confirm →
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Pay Initial Modal */}
      {payingContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-background p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 border-b pb-3">
              <DollarSign className="h-5 w-5 text-primary" />
              <h3 className="font-bold text-lg">Initial Rent & Deposit</h3>
            </div>
            <div className="rounded-xl bg-primary/10 border border-primary/20 p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase">Total to Pay</p>
              <p className="text-3xl font-extrabold text-primary mt-1">
                KSh {(contract.monthlyRent + contract.securityDeposit).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Rent (KSh {contract.monthlyRent?.toLocaleString()}) + Deposit (KSh {contract.securityDeposit?.toLocaleString()})
              </p>
            </div>
            {paymentStatus === "success" ? (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-6 text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600 mb-2" />
                <p className="font-bold text-emerald-800">Payment Received! Tenancy is now active.</p>
              </div>
            ) : paymentStatus === "polling" ? (
              <div className="text-center py-4 space-y-3">
                <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
                <p className="text-sm font-semibold">Waiting for M-Pesa…</p>
                <p className="text-xs text-muted-foreground">Enter your PIN on your phone to complete.</p>
                <Button variant="outline" className="w-full gap-2 border-primary/30 text-primary"
                  onClick={() => setPaymentStatus("idle")}>
                  ↺ Resend M-Pesa Prompt
                </Button>
              </div>
            ) : (
              <>
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">M-Pesa Number</Label>
                  <div className="mt-1.5 flex">
                    <span className="flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm">🇰🇪 +254</span>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="7XX XXX XXX" className="rounded-l-none" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setPayingContract(false)}>Cancel</Button>
                  <Button className="flex-1 bg-primary text-primary-foreground font-bold"
                    loading={payMutation.isPending} disabled={!phone}
                    onClick={() => payMutation.mutate()}>
                    <Phone className="h-4 w-4 mr-1" /> Send STK Push
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
