"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { User, Phone, Mail, Calendar, FileText, Home, ArrowLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function TenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const { data, isLoading, error } = useQuery({
    queryKey: ["tenant-detail", id],
    queryFn: () => api.get(`/api/tenants/${id}`) as Promise<{ tenant: any }>,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !data?.tenant) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <h2 className="text-xl font-bold">Tenant Not Found</h2>
        <p className="text-muted-foreground text-sm max-w-md text-center">
          We couldn't find details for this tenant, or you don't have permission to view them.
        </p>
        <Button variant="outline" onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  const tenant = data.tenant;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tenant Profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">View details and history of this tenant.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="col-span-1 rounded-xl border bg-card p-6 shadow-sm space-y-6">
          <div className="flex flex-col items-center text-center space-y-3">
            <Avatar className="h-24 w-24 border-2 border-primary/10">
              <AvatarImage src={tenant.avatarUrl || ""} />
              <AvatarFallback className="text-2xl">{tenant.fullName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold">{tenant.fullName}</h2>
              <p className="text-sm text-muted-foreground">Tenant since {format(new Date(tenant.createdAt), "MMM yyyy")}</p>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{tenant.email}</span>
            </div>
            {tenant.phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{tenant.phone}</span>
              </div>
            )}
          </div>

          <Link href={`/inbox?tenantId=${tenant.id}`} className="block w-full">
            <Button className="w-full">Message Tenant</Button>
          </Link>
        </div>

        {/* Details & Activity */}
        <div className="col-span-1 md:col-span-2 space-y-6">
          {/* Active Contracts */}
          <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b pb-4">
              <FileText className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">Contracts with You</h3>
            </div>
            
            {tenant.tenantContracts?.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No contracts found.</p>
            ) : (
              <div className="space-y-4">
                {tenant.tenantContracts.map((contract: any) => (
                  <div key={contract.id} className="p-4 rounded-lg border bg-muted/30 flex justify-between items-center flex-wrap gap-4">
                    <div>
                      <p className="font-semibold text-sm">{contract.property.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {contract.unitType.label} - Unit {contract.unit.unitNumber}
                      </p>
                    </div>
                    <Link href={`/dashboard/contracts/${contract.id}`}>
                      <Button variant="outline" size="sm">View Contract</Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bookings */}
          <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b pb-4">
              <Calendar className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">Bookings History</h3>
            </div>
            
            {tenant.tenantBookings?.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No bookings found.</p>
            ) : (
              <div className="space-y-3">
                {tenant.tenantBookings.map((booking: any) => (
                  <div key={booking.id} className="flex justify-between items-center text-sm border-b last:border-0 pb-2 last:pb-0">
                    <div>
                      <p className="font-medium">{booking.property.name}</p>
                      <p className="text-xs text-muted-foreground">For {booking.unitType.label}</p>
                    </div>
                    <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                      {booking.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
