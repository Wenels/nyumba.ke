"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { FileText, Calendar, DollarSign, Home, User, CheckCircle2, ArrowLeft, MessageSquare, ShieldCheck, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import Link from "next/link";

const STATUS_META: Record<string, { label: string; color: string; description: string }> = {
  PENDING: {
    label: "Awaiting Tenant Signature",
    color: "bg-amber-100 text-amber-800 border-amber-200",
    description: "Contract has been prepared. Waiting for tenant to review and sign.",
  },
  AWAITING_PAYMENT: {
    label: "Awaiting First Payment",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    description: "Tenant signed contract. Waiting for initial rent + deposit payment.",
  },
  ACTIVE: {
    label: "Active Tenancy",
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
    description: "Tenancy contract is active and binding.",
  },
  EXPIRED: {
    label: "Lease Expired",
    color: "bg-muted text-muted-foreground border-border",
    description: "This lease has concluded.",
  },
  TERMINATED: {
    label: "Terminated",
    color: "bg-red-100 text-red-800 border-red-200",
    description: "Tenancy was ended early.",
  },
};

export default function LandlordContractDetail() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const { data, isLoading } = useQuery({
    queryKey: ["landlord-contract", id],
    queryFn: () => api.get(`/api/contracts/${id}`) as Promise<{ contract: any }>,
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
        <h2 className="text-xl font-bold">Contract not found</h2>
        <p className="text-sm text-muted-foreground">The contract record could not be found.</p>
        <Button onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Bookings
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
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Bookings
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Tenancy Agreement Details</h1>
            <p className="text-xs text-muted-foreground">{contract.listing?.title}</p>
          </div>
        </div>
        <div className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold ${meta.color}`}>
          <ShieldCheck className="h-3.5 w-3.5" />
          {meta.label}
        </div>
      </div>

      {/* Status banner */}
      <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
          <div>
            <p className="font-bold text-sm text-foreground">{meta.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{meta.description}</p>
          </div>
        </div>
        <Link href="/inbox">
          <Button size="sm" variant="outline" className="gap-2 border-primary/30 text-primary hover:bg-primary/5 shrink-0">
            <MessageSquare className="h-4 w-4" /> Message Tenant
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Terms */}
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
              <CheckCircle2 className="h-3.5 w-3.5" /> Tenant Signed
            </span>
            <span className={`flex items-center gap-1 ${contract.signedByLandlord ? "text-primary font-semibold" : "text-muted-foreground"}`}>
              <CheckCircle2 className="h-3.5 w-3.5" /> Landlord Signed
            </span>
          </div>
        </div>

        {/* Tenant & Property */}
        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-base flex items-center gap-2 border-b pb-3">
            <User className="h-5 w-5 text-primary" /> Tenant & Unit Details
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tenant Name</span>
              <span className="font-semibold">{contract.tenant?.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium text-xs text-muted-foreground flex items-center gap-1">
                <Mail className="h-3 w-3" /> {contract.tenant?.email}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Property</span>
              <span className="font-semibold">{contract.listing?.title}</span>
            </div>
            <div className="flex justify-between border-t pt-3">
              <span className="text-muted-foreground">Assigned Door</span>
              <span className="font-bold text-primary">Unit {contract.unit?.unitNumber || contract.unitNumber}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Ledger */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="bg-muted/50 p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold text-base flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" /> Rent Payment Ledger
          </h3>
          <span className="text-xs text-muted-foreground">
            {contract.rentPayments?.filter((p: any) => p.status === "PAID").length || 0} of {contract.rentPayments?.length || 0} Paid
          </span>
        </div>
        <div className="p-4">
          {!contract.rentPayments?.length ? (
            <p className="text-sm text-muted-foreground text-center py-6">No payments recorded yet.</p>
          ) : (
            <div className="divide-y">
              {contract.rentPayments?.map((payment: any) => (
                <div key={payment.id} className="py-3 flex justify-between items-center text-sm">
                  <div>
                    <p className="font-semibold">Cycle {payment.cycleNumber}</p>
                    <p className="text-xs text-muted-foreground">Due: {format(new Date(payment.dueDate), "dd MMM yyyy")}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">KSh {payment.amount?.toLocaleString()}</p>
                    <span className={`text-xs font-bold ${payment.status === 'PAID' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {payment.status.replace("_", " ")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
