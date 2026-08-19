"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { DollarSign, ArrowLeft, Calendar, FileText, CheckCircle2, AlertCircle, Building2, User, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import Link from "next/link";

export default function LandlordTransactionDetail() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const { data, isLoading } = useQuery({
    queryKey: ["payment-detail", id],
    queryFn: () => api.get(`/api/rent-payments/${id}`) as Promise<{ payment: any }>,
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
          <ArrowLeft className="h-4 w-4" /> Back to Transactions
        </Button>
      </div>
    );
  }

  const isPaid = payment.status === "PAID";

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header with labeled back button */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => router.back()} className="gap-2 text-xs shrink-0">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Transactions
        </Button>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Transaction Details</h1>
          <p className="text-xs text-muted-foreground">
            {payment.contract?.listing?.title || "Rent Payment"} — Cycle {payment.cycleNumber}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Payment Summary */}
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className={`p-5 text-white ${isPaid ? "bg-emerald-600" : "bg-amber-500"}`}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium opacity-80">Rent Cycle {payment.cycleNumber}</p>
                <p className="text-3xl font-extrabold mt-1">KSh {payment.amount?.toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-bold">
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

        {/* Contract & Tenant Reference */}
        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-base flex items-center gap-2 border-b pb-3">
            <Building2 className="h-5 w-5 text-primary" /> Tenant & Property Reference
          </h3>
          
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs mb-1 flex items-center gap-1"><User className="h-3.5 w-3.5" /> Tenant</p>
              <p className="font-semibold">{payment.contract?.tenant?.fullName || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">Property</p>
              <p className="font-semibold">{payment.contract?.listing?.title || payment.contract?.property?.name || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">Unit</p>
              <p className="font-semibold">
                {payment.contract?.unitType?.label ? `${payment.contract.unitType.label} — ` : ""}
                Unit {payment.contract?.unit?.unitNumber || payment.contract?.unitNumber || "—"}
              </p>
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <Link href="/inbox">
              <Button variant="outline" size="sm" className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/5">
                <MessageSquare className="h-4 w-4" /> Message Tenant
              </Button>
            </Link>
            <Link href={`/dashboard/contracts/${payment.contractId || payment.contract?.id}`}>
              <Button variant="outline" size="sm" className="w-full gap-2">
                <FileText className="h-4 w-4" /> View Tenancy Contract
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
