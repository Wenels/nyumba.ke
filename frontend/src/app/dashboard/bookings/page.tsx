"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { Calendar, CheckCircle2, XCircle, Clock, Eye, Search, Filter, Key, Building2, X } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";

const TABS = ["ALL", "NEED_REVIEW", "VIEWING_SCHEDULED", "APPROVED", "REJECTED", "COMPLETED"];

export default function BookingsPage() {
  const [activeTab, setActiveTab] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [approvingBooking, setApprovingBooking] = useState<any>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["landlord-bookings"],
    queryFn: () => api.get("/api/bookings/landlord") as Promise<{ bookings: any[]; stats: any }>,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status, unitId }: { id: string; status: string; unitId?: string }) =>
      api.patch(`/api/bookings/${id}/status`, { status, unitId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landlord-bookings"] });
      toast.success("Booking updated");
      setApprovingBooking(null);
      setSelectedUnitId("");
    },
    onError: (err) => {
      toast.error("Failed to update booking", { description: err instanceof ApiError ? (err.body as any)?.error : "Error" });
    },
  });

  const bookings = data?.bookings ?? [];
  const stats = data?.stats ?? { total: 0, needReview: 0, approved: 0 };

  const filtered = (activeTab === "ALL" ? bookings : bookings.filter((b: any) => b.status === activeTab))
    .filter((b: any) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return b.tenant?.fullName?.toLowerCase().includes(q) ||
             b.listing?.title?.toLowerCase().includes(q) ||
             b.unitType?.toLowerCase().includes(q);
    });

  function openApprovalModal(booking: any) {
    setApprovingBooking(booking);
    const vacantUnits = booking.unitTypeDetails?.units?.filter((u: any) => u.status === "VACANT") || [];
    if (vacantUnits.length > 0) {
      setSelectedUnitId(vacantUnits[0].id);
    }
  }

  function handleConfirmApproval() {
    if (!approvingBooking) return;
    statusMutation.mutate({
      id: approvingBooking.id,
      status: "APPROVED",
      unitId: selectedUnitId || undefined,
    });
  }

  return (
    <div className="space-y-6">
      {/* Unit Assignment Approval Modal */}
      {approvingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 px-4">
          <div className="w-full max-w-md rounded-2xl bg-background p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-lg">Approve & Assign Unit</h3>
              </div>
              <button onClick={() => setApprovingBooking(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-xl bg-muted/40 p-4 space-y-2 text-sm">
              <p className="font-semibold text-foreground">{approvingBooking.tenant?.fullName}</p>
              <p className="text-xs text-muted-foreground">Property: <span className="font-medium text-foreground">{approvingBooking.listing?.title}</span></p>
              <p className="text-xs text-muted-foreground">Category: <span className="font-semibold text-primary">{approvingBooking.unitType}</span></p>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                <Key className="h-3.5 w-3.5 text-primary" /> Assign Specific Vacant Room:
              </label>

              {(() => {
                const vacantUnits = approvingBooking.unitTypeDetails?.units?.filter((u: any) => u.status === "VACANT") || [];
                if (vacantUnits.length === 0) {
                  return (
                    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-800">
                      No specific vacant room registered for this unit type. Approving will create a contract for the category.
                    </div>
                  );
                }
                return (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {vacantUnits.map((u: any) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => setSelectedUnitId(u.id)}
                        className={`w-full flex items-center justify-between rounded-lg border-2 p-3 text-xs font-medium transition-colors text-left ${
                          selectedUnitId === u.id
                            ? "border-primary bg-primary/5 text-primary font-bold shadow-sm"
                            : "border-border hover:border-primary/50 text-foreground"
                        }`}
                      >
                        <div>
                          <p className="font-bold">Unit {u.unitNumber}</p>
                          <p className="text-[11px] text-muted-foreground">Floor {u.floor} {u.doorNumber ? `(Door ${u.doorNumber})` : ""}</p>
                        </div>
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                          VACANT
                        </span>
                      </button>
                    ))}
                  </div>
                );
              })()}
            </div>

            <div className="pt-3 flex gap-3 border-t border-border">
              <Button variant="outline" className="flex-1" onClick={() => setApprovingBooking(null)}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                loading={statusMutation.isPending}
                onClick={handleConfirmApproval}
              >
                Confirm & Assign
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bookings Management</h1>
          <p className="mt-1 text-muted-foreground">Review tenant bookings and assign vacant units</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Bookings", value: stats.total, icon: Calendar },
          { label: "Need Review", value: stats.needReview, icon: Clock, color: "text-secondary" },
          { label: "Approved", value: stats.approved, icon: CheckCircle2, color: "text-primary" },
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

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-card p-2 rounded-xl border border-border">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by property, tenant name, unit category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-4 rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" className="h-9 gap-2 bg-muted/50 text-muted-foreground font-medium w-full sm:w-auto">
            <Filter className="h-4 w-4" /> Filters <span className="text-[10px] ml-1">▼</span>
          </Button>

          <div className="flex items-center bg-muted/50 rounded-lg p-1 shrink-0 h-9">
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center justify-center px-3 h-full text-xs font-medium rounded-md transition-all ${
                viewMode === "list"
                  ? "bg-background text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`flex items-center justify-center px-3 h-full text-xs font-medium rounded-md transition-all ${
                viewMode === "grid"
                  ? "bg-background text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Grid
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === tab
                ? "bg-primary text-primary-foreground"
                : "border border-border hover:border-primary hover:text-primary"
            }`}
          >
            {tab.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Calendar className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 font-semibold">No bookings yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Bookings appear here once tenants book your properties</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((booking: any) => (
            <div key={booking.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold">{booking.tenant?.fullName}</p>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      booking.status === "APPROVED" ? "bg-primary/10 text-primary" :
                      booking.status === "NEED_REVIEW" || booking.status === "PENDING" ? "bg-yellow-100 text-yellow-700" :
                      booking.status === "REJECTED" ? "bg-destructive/10 text-destructive" :
                      "bg-muted text-muted-foreground"
                    }`}>{booking.status.replace("_", " ")}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground truncate">{booking.listing?.title}</p>
                  <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Category: {booking.unitType}</span>
                    {booking.unit && <span className="font-bold text-primary">Assigned: Unit {booking.unit.unitNumber}</span>}
                    <span>Move-in: {format(new Date(booking.moveInDate), "dd MMM yyyy")}</span>
                    <span>Lease: {booking.leaseDuration} months</span>
                    {booking.viewingDate && <span>Viewing: {format(new Date(booking.viewingDate), "dd MMM yyyy, HH:mm")}</span>}
                  </div>
                  <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                    <span>{booking.tenant?.email}</span>
                    {booking.tenant?.phone && <span>{booking.tenant.phone}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {(booking.status === "PENDING" || booking.status === "NEED_REVIEW") && (
                    <>
                      <Button size="sm" onClick={() => openApprovalModal(booking)}
                        className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Approve & Assign
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => statusMutation.mutate({ id: booking.id, status: "REJECTED" })}
                        className="gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10">
                        <XCircle className="h-3.5 w-3.5" /> Reject
                      </Button>
                    </>
                  )}
                  {booking.status === "APPROVED" && (
                    <Button size="sm" variant="outline" onClick={() => statusMutation.mutate({ id: booking.id, status: "COMPLETED" })}
                      className="gap-1.5">
                      <Eye className="h-3.5 w-3.5" /> Mark Complete
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
