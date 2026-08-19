"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  DollarSign, ArrowLeft, Calendar, FileText, CheckCircle2,
  AlertCircle, Clock, Home, Phone, Loader2, Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import Link from "next/link";
import { toast } from "sonner";

export default function TenantTransactionDetail() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params?.id as string;

  const [phone, setPhone] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "polling" | "success">("idle");

  const { data, isLoading } = useQuery({
    queryKey: ["payment-detail", id],
    queryFn: () => api.get(`/api/rent-payments/${id}`) as Promise<{ payment: any }>,
  });

  const payMutation = useMutation({
    mutationFn: () => api.post(`/api/rent-payments/${id}/pay`, { phone }),
    onSuccess: () => {
      setPaymentStatus("polling");
      toast.success("STK Push sent!", { description: "Enter your M-Pesa PIN to complete payment." });
    },
    onError: (err: any) => {
      toast.error("Payment failed", { description: err?.body?.error || "Error" });
    },
  });

  const simulatePaymentMutation = useMutation({
    mutationFn: () => api.post(`/api/rent-payments/${id}/confirm-payment`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["tenant-payments"] });
      setPaymentStatus("success");
      toast.success("Payment completed!");
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const payment = data?.payment;

  if (!payment) {
    return (
      <div className="text-center py-20 space-y-4">
        <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-bold">Transaction not found</h2>
        <p className="text-sm text-muted-foreground">This payment record could not be found.</p>
        <Button onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Payments
        </Button>
      </div>
    );
  }

  const isPaid = payment.status === "PAID";
  const isOverdue = payment.status === "OVERDUE";
  const isDue = payment.status === "DUE_NOW" || payment.status === "DUE_SOON";
  const needsPayment = !isPaid && payment.status !== "UPCOMING";

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">

      {/* Header with labeled back button */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => router.back()} className="gap-2 text-xs shrink-0">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Payments
        </Button>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Transaction Details</h1>
          <p className="text-xs text-muted-foreground">
            {payment.contract?.listing?.title || "Rent Payment"} — Cycle {payment.cycleNumber}
          </p>
        </div>
      </div>

      {/* Overdue / Due action banner */}
      {needsPayment && paymentStatus === "idle" && (
        <div className={`rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          isOverdue ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"
        }`}>
          <div className="flex items-start gap-3">
            <AlertCircle className={`h-5 w-5 shrink-0 mt-0.5 ${isOverdue ? "text-red-600" : "text-amber-600"}`} />
            <div>
              <p className={`font-bold text-sm ${isOverdue ? "text-red-900" : "text-amber-900"}`}>
                {isOverdue ? "⚠️ This payment is OVERDUE" : "⚡ Payment Due — Action Required"}
              </p>
              <p className={`text-xs mt-0.5 ${isOverdue ? "text-red-700" : "text-amber-700"}`}>
                KSh {payment.amount?.toLocaleString()} was due on {format(new Date(payment.dueDate), "dd MMM yyyy")}. Pay now to avoid penalties.
              </p>
            </div>
          </div>
          <Button
            onClick={() => document.getElementById("pay-section")?.scrollIntoView({ behavior: "smooth" })}
            className={`gap-2 font-bold shrink-0 ${isOverdue ? "bg-red-600 text-white hover:bg-red-700" : "bg-amber-600 text-white hover:bg-amber-700"}`}>
            <DollarSign className="h-4 w-4" /> Pay KSh {payment.amount?.toLocaleString()} →
          </Button>
        </div>
      )}

      {isPaid && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <div>
            <p className="font-bold text-emerald-800 text-sm">Payment Confirmed</p>
            <p className="text-xs text-emerald-700">
              Received on {payment.paidDate ? format(new Date(payment.paidDate), "dd MMM yyyy") : "—"} · Receipt: {payment.mpesaReceiptNo || "N/A"}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Payment Summary Card */}
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className={`p-5 text-white ${
            isPaid ? "bg-emerald-600" :
            isOverdue ? "bg-red-600" :
            isDue ? "bg-amber-500" :
            "bg-muted text-foreground"
          }`}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium opacity-80">Rent Cycle {payment.cycleNumber}</p>
                <p className="text-3xl font-extrabold mt-1">KSh {payment.amount?.toLocaleString()}</p>
              </div>
              <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                isPaid ? "bg-white/20" : "bg-white/25"
              }`}>
                {isPaid ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                {payment.status.replace("_", " ")}
              </div>
            </div>
          </div>

          <div className="p-5 space-y-3 text-sm">
            <div className="flex justify-between items-center border-b pb-3">
              <span className="text-muted-foreground flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Due Date</span>
              <span className="font-semibold">{format(new Date(payment.dueDate), "dd MMM yyyy")}</span>
            </div>
            {isPaid && payment.paidDate && (
              <div className="flex justify-between items-center border-b pb-3">
                <span className="text-muted-foreground flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Paid On</span>
                <span className="font-semibold text-emerald-700">{format(new Date(payment.paidDate), "dd MMM yyyy")}</span>
              </div>
            )}
            {isPaid && (
              <div className="flex justify-between items-center border-b pb-3">
                <span className="text-muted-foreground">M-Pesa Receipt</span>
                <span className="font-mono text-xs font-bold text-foreground">{payment.mpesaReceiptNo || "—"}</span>
              </div>
            )}
            <div className="flex justify-between items-center border-b pb-3">
              <span className="text-muted-foreground">Cycle</span>
              <span className="font-semibold">#{payment.cycleNumber}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Transaction ID</span>
              <span className="font-mono text-[10px] text-muted-foreground truncate max-w-[55%]">{payment.id}</span>
            </div>
          </div>
        </div>

        {/* Contract & Property Reference */}
        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-base flex items-center gap-2 border-b pb-3">
            <Building2 className="h-5 w-5 text-primary" /> Property & Contract
          </h3>
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs mb-1 flex items-center gap-1"><Home className="h-3.5 w-3.5" /> Property</p>
              <p className="font-semibold">{payment.contract?.listing?.title || payment.contract?.property?.name || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">Landlord</p>
              <p className="font-semibold">{payment.contract?.landlord?.fullName || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">Unit</p>
              <p className="font-semibold">
                {payment.contract?.unitType?.label ? `${payment.contract.unitType.label} — ` : ""}
                Unit {payment.contract?.unit?.unitNumber || "—"}
              </p>
            </div>
          </div>
          <Link href={`/tenant/contracts/${payment.contractId || payment.contract?.id}`} className="block">
            <Button variant="outline" size="sm" className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/5">
              <FileText className="h-4 w-4" /> View Full Contract
            </Button>
          </Link>
        </div>
      </div>

      {/* Pay Section — only shown for unpaid */}
      {needsPayment && (
        <div id="pay-section" className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="bg-muted/50 p-4 border-b">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary" /> Pay via M-Pesa
            </h3>
          </div>
          <div className="p-6 max-w-sm mx-auto space-y-4">
            {paymentStatus === "success" ? (
              <div className="text-center py-4 space-y-3">
                <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
                <p className="font-bold text-emerald-800">Payment Successful!</p>
                <p className="text-sm text-muted-foreground">Your rent has been paid for Cycle {payment.cycleNumber}.</p>
                <Link href="/tenant/payments">
                  <Button className="mt-2 w-full bg-primary text-primary-foreground">View Payment History</Button>
                </Link>
              </div>
            ) : paymentStatus === "polling" ? (
              <div className="text-center py-4 space-y-3">
                <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
                <p className="font-semibold text-sm">Waiting for M-Pesa…</p>
                <p className="text-xs text-muted-foreground">Enter your PIN on your phone. This page will update automatically.</p>
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
                  Didn&apos;t receive the prompt? Check network then tap below.
                </div>
                <Button variant="outline" className="w-full gap-2 border-primary/30 text-primary"
                  onClick={() => setPaymentStatus("idle")}>
                  ↺ Resend M-Pesa Prompt
                </Button>
                <Button variant="outline" size="sm" className="w-full border-dashed text-xs text-muted-foreground"
                  onClick={() => simulatePaymentMutation.mutate()} loading={simulatePaymentMutation.isPending}>
                  Simulate Payment (Dev Only)
                </Button>
              </div>
            ) : (
              <>
                <div className="rounded-xl bg-primary/5 border border-primary/10 p-4 text-center">
                  <p className="text-xs text-muted-foreground uppercase">Amount Due</p>
                  <p className="text-3xl font-extrabold text-primary mt-1">KSh {payment.amount?.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">Due: {format(new Date(payment.dueDate), "dd MMM yyyy")}</p>
                </div>
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">M-Pesa Phone Number</Label>
                  <div className="mt-1.5 flex">
                    <span className="flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm">🇰🇪 +254</span>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="7XX XXX XXX" className="rounded-l-none" />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">An STK push will be sent to this number</p>
                </div>
                <Button
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold gap-2"
                  loading={payMutation.isPending}
                  disabled={!phone}
                  onClick={() => payMutation.mutate()}>
                  <Phone className="h-4 w-4" />
                  {payMutation.isPending ? "Sending…" : `Pay KSh ${payment.amount?.toLocaleString()} via M-Pesa`}
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* If paid, quick navigation links */}
      {isPaid && (
        <div className="flex flex-wrap gap-3">
          <Link href="/tenant/payments">
            <Button variant="outline" size="sm" className="gap-2">
              <Clock className="h-4 w-4" /> View All Payments
            </Button>
          </Link>
          <Link href="/tenant/contracts">
            <Button variant="outline" size="sm" className="gap-2">
              <FileText className="h-4 w-4" /> My Contracts
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
