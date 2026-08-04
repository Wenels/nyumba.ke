"use client";

import { useQuery } from "@tanstack/react-query";
import { ListChecks, Home, User, Mail, Phone, Clock } from "lucide-react";
import { format } from "date-fns";
import { api } from "@/lib/api";

export default function WaitlistPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["landlord-waitlist"],
    queryFn: () => api.get("/api/listings/waitlist/landlord") as Promise<{ waitlist: any[] }>,
  });

  const waitlist = data?.waitlist ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Waitlist Management</h1>
        <p className="mt-1 text-muted-foreground">See who is waiting for your properties</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />)}
        </div>
      ) : waitlist.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <ListChecks className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 font-semibold">Waitlist is empty</p>
          <p className="mt-1 text-sm text-muted-foreground">Tenants who join the waitlist for your properties will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {waitlist.map((item: any) => (
            <div key={item.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Home className="h-4 w-4 text-primary" />
                    <p className="font-bold">{item.property?.name}</p>
                    <span className="rounded-full bg-secondary/10 px-2 py-0.5 text-xs font-semibold text-secondary">
                      {item.unitType?.label || "Any Unit Type"}
                    </span>
                  </div>
                  
                  <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5"><User className="h-4 w-4" />{item.tenant?.fullName}</span>
                    <span className="flex items-center gap-1.5"><Mail className="h-4 w-4" />{item.tenant?.email}</span>
                    {item.tenant?.phone && <span className="flex items-center gap-1.5"><Phone className="h-4 w-4" />{item.tenant.phone}</span>}
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2 text-xs text-muted-foreground shrink-0">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> 
                    Joined {format(new Date(item.createdAt), "dd MMM yyyy")}
                  </span>
                  <span className={`rounded-full px-2.5 py-1 font-medium ${
                    item.status === "WAITING" ? "bg-amber-100 text-amber-800" :
                    item.status === "NOTIFIED" ? "bg-blue-100 text-blue-800" :
                    "bg-emerald-100 text-emerald-800"
                  }`}>{item.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
