"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Building2, MapPin, Users, CheckCircle, ArrowLeft, Home, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export default function LandlordListingDetail() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const { data, isLoading } = useQuery({
    queryKey: ["landlord-listing", slug],
    queryFn: () => api.get(`/api/listings/landlord/${slug}`) as Promise<{ property: any }>,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const property = data?.property;

  if (!property) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold">Property not found</h2>
        <Button className="mt-4" onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-10">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{property.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3" /> {property.address}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left Column - General Info */}
        <div className="col-span-1 space-y-6">
          <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" /> Info
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between border-b pb-1">
                <span className="text-muted-foreground">Type</span>
                <span className="font-medium">{property.propertyType}</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium">{property.status}</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-muted-foreground">Total Units</span>
                <span className="font-medium">{property.totalUnits}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Floors</span>
                <span className="font-medium">{property.totalFloors}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Units & Details */}
        <div className="col-span-1 md:col-span-3 space-y-6">
          <h3 className="font-semibold text-xl">Unit Types & Units</h3>
          
          {property.unitTypes?.map((ut: any) => (
            <div key={ut.id} className="rounded-xl border bg-card shadow-sm overflow-hidden">
              <div className="bg-muted/50 p-4 border-b flex justify-between items-center">
                <div>
                  <h4 className="font-semibold text-lg">{ut.label}</h4>
                  <p className="text-sm text-muted-foreground">Rent: KSh {ut.monthlyRent.toLocaleString()} | Deposit: KSh {ut.securityDeposit.toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                  <span className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                    <Home className="h-3 w-3" /> {ut.units?.length || 0} Units
                  </span>
                </div>
              </div>
              
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {ut.units?.map((unit: any) => (
                  <div key={unit.id} className="border rounded-lg p-3 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-bold">Unit {unit.unitNumber}</span>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        unit.status === 'OCCUPIED' ? 'bg-green-100 text-green-700' : 
                        unit.status === 'VACANT' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {unit.status}
                      </span>
                    </div>
                    
                    {unit.contracts?.length > 0 && (
                      <div className="text-xs bg-muted p-2 rounded">
                        <p className="font-semibold mb-1 flex items-center gap-1">
                          <Users className="h-3 w-3" /> Current Tenant
                        </p>
                        <p>{unit.contracts[0].tenant.fullName}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
