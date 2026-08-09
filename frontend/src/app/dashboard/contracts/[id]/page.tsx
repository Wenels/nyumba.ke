"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { FileText, Calendar, DollarSign, Home, User, CheckCircle2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

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
      <div className="text-center py-20">
        <h2 className="text-xl font-bold">Contract not found</h2>
        <Button className="mt-4" onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Contract Details</h1>
            <p className="mt-1 text-sm text-muted-foreground flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                contract.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                contract.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {contract.status}
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Lease Info */}
        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2 border-b pb-2">
            <FileText className="h-5 w-5 text-primary" /> Terms
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Start Date</span>
              <span className="font-medium">{format(new Date(contract.startDate), "PPP")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">End Date</span>
              <span className="font-medium">{format(new Date(contract.endDate), "PPP")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Monthly Rent</span>
              <span className="font-medium">KSh {contract.monthlyRent.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Security Deposit</span>
              <span className="font-medium">KSh {contract.securityDeposit.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Property & Tenant Info */}
        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2 border-b pb-2">
            <Home className="h-5 w-5 text-primary" /> Property
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Property</span>
              <span className="font-medium">{contract.listing.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Unit Type</span>
              <span className="font-medium">{contract.unitType?.label}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Unit Number</span>
              <span className="font-medium">Unit {contract.unitNumber}</span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span className="text-muted-foreground flex items-center gap-1"><User className="h-4 w-4"/> Tenant</span>
              <span className="font-medium">{contract.tenant.fullName}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Ledger */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="bg-muted/50 p-4 border-b">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" /> Payment Ledger
          </h3>
        </div>
        <div className="p-4">
          {contract.rentPayments?.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No payments found.</p>
          ) : (
            <div className="divide-y">
              {contract.rentPayments?.map((payment: any) => (
                <div key={payment.id} className="py-3 flex justify-between items-center text-sm">
                  <div>
                    <p className="font-medium">Cycle {payment.cycleNumber}</p>
                    <p className="text-xs text-muted-foreground">Due: {format(new Date(payment.dueDate), "PPP")}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">KSh {payment.amount.toLocaleString()}</p>
                    <p className={`text-xs font-semibold ${payment.status === 'PAID' ? 'text-green-600' : 'text-yellow-600'}`}>
                      {payment.status}
                    </p>
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
