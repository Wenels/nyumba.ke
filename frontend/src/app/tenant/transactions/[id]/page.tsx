"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { DollarSign, ArrowLeft, Calendar, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export default function TenantTransactionDetail() {
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
      <div className="text-center py-20">
        <h2 className="text-xl font-bold">Transaction not found</h2>
        <Button className="mt-4" onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-10">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Transaction Details</h1>
          <p className="mt-1 text-sm text-muted-foreground">View absolute all details of this payment.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Payment Summary */}
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className={`p-6 text-white ${payment.status === 'PAID' ? 'bg-green-600' : 'bg-yellow-500'}`}>
            <div className="flex justify-between items-start">
              <DollarSign className="h-10 w-10 opacity-50" />
              <div className="text-right">
                <p className="text-sm font-medium opacity-80">Amount</p>
                <p className="text-3xl font-bold">KSh {payment.amount.toLocaleString()}</p>
              </div>
            </div>
            <div className="mt-6 flex items-center gap-2">
              {payment.status === 'PAID' ? <CheckCircle2 className="h-5 w-5"/> : <AlertCircle className="h-5 w-5"/>}
              <span className="font-semibold">{payment.status}</span>
            </div>
          </div>
          
          <div className="p-6 space-y-4 text-sm">
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground flex items-center gap-1"><Calendar className="h-4 w-4"/> Due Date</span>
              <span className="font-medium">{format(new Date(payment.dueDate), "PPP")}</span>
            </div>
            {payment.paidDate && (
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground flex items-center gap-1"><CheckCircle2 className="h-4 w-4"/> Paid Date</span>
                <span className="font-medium">{format(new Date(payment.paidDate), "PPP")}</span>
              </div>
            )}
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">M-Pesa Receipt No</span>
              <span className="font-medium">{payment.mpesaReceiptNo || "N/A"}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Cycle Number</span>
              <span className="font-medium">{payment.cycleNumber}</span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="text-muted-foreground">Transaction ID</span>
              <span className="font-medium text-xs font-mono">{payment.id}</span>
            </div>
          </div>
        </div>

        {/* Contract & Property Reference */}
        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2 border-b pb-2">
            <FileText className="h-5 w-5 text-primary" /> Contract Reference
          </h3>
          
          <div className="space-y-4 text-sm pt-2">
            <div>
              <p className="text-muted-foreground text-xs mb-1">Landlord Name</p>
              <p className="font-medium">{payment.contract?.landlord?.fullName}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">Property</p>
              <p className="font-medium">{payment.contract?.property?.name}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">Unit</p>
              <p className="font-medium">{payment.contract?.unitType?.label} - Unit {payment.contract?.unit?.unitNumber}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
