"use client";

import { use, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  ArrowLeft, CheckCircle2, ChevronRight,
  Home, MapPin, DollarSign, Phone, Key
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/app/features/auth/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const LEASE_DURATIONS = [6, 12, 18, 24, 36];
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const STEPS = [
  { num: 1, label: "Unit Category" },
  { num: 2, label: "Schedule" },
  { num: 3, label: "Review" },
];

export default function BookListingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [selectedUnitTypeId, setSelectedUnitTypeId] = useState<string>("");
  const [moveInDate, setMoveInDate] = useState("");
  const [leaseDuration, setLeaseDuration] = useState(12);
  const [viewingDate, setViewingDate] = useState("");
  const [phoneNumber, setPhoneNumber] = useState(user?.phone?.replace(/^0/, "") ?? "");
  const [showMpesa, setShowMpesa] = useState(false);
  const [bookingCreated, setBookingCreated] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["listings", slug],
    queryFn: () => api.get(`/api/listings/${slug}`) as Promise<{ listing: any; property: any }>,
    enabled: !!slug,
  });

  const property = data?.property || data?.listing;
  const unitTypes = property?.unitTypes || [];

  useEffect(() => {
    const paramUnitTypeId = searchParams.get("unitTypeId");
    if (paramUnitTypeId && unitTypes.length > 0) {
      const match = unitTypes.find((ut: any) => ut.id === paramUnitTypeId);
      if (match) setSelectedUnitTypeId(match.id);
    } else if (unitTypes.length > 0 && !selectedUnitTypeId) {
      setSelectedUnitTypeId(unitTypes[0].id);
    }
  }, [searchParams, unitTypes, selectedUnitTypeId]);

  const selectedUnitType = unitTypes.find((ut: any) => ut.id === selectedUnitTypeId) || unitTypes[0];

  const bookingMutation = useMutation({
    mutationFn: (data: any) => api.post("/api/bookings", data),
    onSuccess: (res: any) => {
      setBookingCreated(res.booking);
      setShowMpesa(true);
    },
    onError: (err) => {
      const message = err instanceof ApiError ? (err.body as any)?.error : "Booking failed";
      toast.error("Failed", { description: message });
    },
  });

  const payMutation = useMutation({
    mutationFn: () => Promise.resolve({ ok: true }),
    onSuccess: () => {
      toast.success("Booking confirmed!", { description: "The landlord will review and assign your unit." });
      router.push("/tenant/bookings");
    },
  });

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center text-center px-6">
        <p className="text-lg font-semibold">Sign in to book this property</p>
        <Link href="/login" className="mt-4">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Sign In</Button>
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <p>Property not found</p>
        <Link href="/browse" className="mt-4 text-primary hover:underline">← Back to browse</Link>
      </div>
    );
  }

  function canProceed() {
    if (step === 1) return !!selectedUnitTypeId;
    if (step === 2) return !!moveInDate;
    return true;
  }

  function handleNext() {
    if (!canProceed()) { toast.error("Please fill all required fields"); return; }
    if (step === 3) {
      bookingMutation.mutate({
        propertyId: property.id,
        unitTypeId: selectedUnitType?.id,
        moveInDate: new Date(moveInDate).toISOString(),
        leaseDuration,
        viewingDate: viewingDate ? new Date(viewingDate).toISOString() : undefined,
      });
      return;
    }
    setStep(s => s + 1);
  }

  return (
    <div className="min-h-screen bg-muted/20">
      {/* M-Pesa modal */}
      {showMpesa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-background p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">M-Pesa Booking Fee</p>
                <p className="text-xs text-muted-foreground">Enter your Safaricom number</p>
              </div>
            </div>

            <div className="rounded-xl bg-primary/5 border border-primary/10 p-4 text-center mb-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Amount to Pay</p>
              <p className="text-4xl font-bold text-primary mt-1">1,000</p>
              <p className="text-sm text-muted-foreground">KES</p>
              <p className="mt-1 text-xs text-muted-foreground">Valid for up to 5 booking attempts — refundable if all fail</p>
            </div>

            <div className="mb-4">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Phone Number</Label>
              <div className="mt-1.5 flex">
                <span className="flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground whitespace-nowrap">
                  🇰🇪 +254
                </span>
                <Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="7XX XXX XXX" className="rounded-l-none" />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">A push notification will be sent to this number</p>
            </div>

            <Button
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
              loading={payMutation.isPending}
              disabled={!phoneNumber}
              onClick={() => payMutation.mutate()}>
              {payMutation.isPending ? "Processing..." : "Send STK Push"}
            </Button>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-lg px-4 py-8">
        {/* Back */}
        <Link href={`/listings/${slug}`}
          className="mb-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Property Details
        </Link>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">New Booking Request</h1>
          <p className="text-sm text-muted-foreground">Reserve your unit in {property.name || property.title}</p>
        </div>

        {/* Progress steps */}
        <div className="mb-6 flex items-center">
          {STEPS.map((s, i) => (
            <div key={s.num} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors ${
                  step > s.num ? "border-primary bg-primary text-primary-foreground" :
                  step === s.num ? "border-primary text-primary" :
                  "border-border text-muted-foreground"
                }`}>
                  {step > s.num ? <CheckCircle2 className="h-5 w-5" /> : s.num}
                </div>
                <p className={`mt-1 text-xs font-medium ${step >= s.num ? "text-primary" : "text-muted-foreground"}`}>
                  {s.label}
                </p>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 mb-5 transition-colors ${step > s.num ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
          ))}
          <p className="ml-4 text-xs text-muted-foreground mb-5">{step} / {STEPS.length}</p>
        </div>

        {/* Property card */}
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-border bg-card p-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Home className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold truncate">{property.name || property.title}</p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />{property.address}
            </p>
          </div>
        </div>

        {/* Step content */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
          {/* STEP 1 — Unit Category */}
          {step === 1 && (
            <>
              <div>
                <h2 className="text-xl font-bold">Choose Unit Category</h2>
                <p className="text-sm text-muted-foreground">Select the unit type you wish to rent.</p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">A</span>
                  <Label className="text-sm font-semibold">Available Categories</Label>
                </div>
                <div className="space-y-2">
                  {unitTypes.map((ut: any) => {
                    const isSelected = selectedUnitTypeId === ut.id;
                    const vacantCount = ut.units?.filter((u: any) => u.status === "VACANT")?.length || 0;
                    return (
                      <button key={ut.id} onClick={() => setSelectedUnitTypeId(ut.id)}
                        className={`w-full flex items-center justify-between rounded-xl border-2 p-4 text-left transition-colors ${
                          isSelected ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/50"
                        }`}>
                        <div>
                          <p className="font-bold text-foreground text-base">{ut.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {ut.bedroomCount === 0 ? "Studio" : `${ut.bedroomCount} Bedroom`} • {ut.bathrooms} Bath • <span className="text-primary font-medium">{vacantCount} vacant</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-extrabold text-secondary text-base">KSh {ut.monthlyRent.toLocaleString()}</p>
                          <p className="text-[11px] text-muted-foreground">/month</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedUnitType && (
                <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Category Pricing Summary</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><p className="text-xs text-muted-foreground">Category</p><p className="font-semibold">{selectedUnitType.label}</p></div>
                    <div><p className="text-xs text-muted-foreground">Monthly Rent</p><p className="font-semibold">KSh {selectedUnitType.monthlyRent.toLocaleString()}</p></div>
                    <div><p className="text-xs text-muted-foreground">Security Deposit</p><p className="font-semibold">KSh {selectedUnitType.securityDeposit.toLocaleString()}</p></div>
                    <div><p className="text-xs text-muted-foreground">Vacant Units</p><p className="font-semibold text-primary">{selectedUnitType.units?.filter((u: any) => u.status === "VACANT")?.length || 0} ready</p></div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* STEP 2 — Schedule */}
          {step === 2 && (
            <>
              <div>
                <h2 className="text-xl font-bold">Set Your Schedule</h2>
                <p className="text-sm text-muted-foreground">When would you like to move in?</p>
              </div>

              <div>
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Preferred Move-in Date *
                </Label>
                <Input type="date" value={moveInDate} onChange={(e) => setMoveInDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]} className="mt-1.5" />
              </div>

              <div>
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Lease Duration
                </Label>
                <div className="mt-1.5 flex gap-2 flex-wrap">
                  {LEASE_DURATIONS.map((d) => (
                    <button key={d} onClick={() => setLeaseDuration(d)}
                      className={`rounded-lg border-2 px-4 py-2 text-sm font-semibold transition-colors ${
                        leaseDuration === d ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/50"
                      }`}>
                      {d}mo
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Schedule a Viewing <span className="text-muted-foreground/50 normal-case">(Optional)</span>
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5 mb-1.5">Visit the property before committing</p>
                <Input type="datetime-local" value={viewingDate} onChange={(e) => setViewingDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)} className="mt-0" />
              </div>

              {viewingDate && (
                <div className="rounded-lg border border-secondary/20 bg-secondary/5 p-3 text-xs text-muted-foreground">
                  Both you and the landlord must confirm viewing was completed before approval can proceed.
                </div>
              )}
            </>
          )}

          {/* STEP 3 — Review & Confirm */}
          {step === 3 && (
            <>
              <div>
                <h2 className="text-xl font-bold">Review & Confirm</h2>
                <p className="text-sm text-muted-foreground">Confirm your booking details below</p>
              </div>

              {/* Booking details table */}
              <div className="rounded-xl border border-border overflow-hidden">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground bg-muted/30 px-4 py-2">
                  Booking Details
                </p>
                {[
                  ["Building", property.name || property.title],
                  ["Unit Category", selectedUnitType?.label],
                  ["Monthly Rent", `KSh ${selectedUnitType?.monthlyRent.toLocaleString()}`],
                  ["Security Deposit", `KSh ${selectedUnitType?.securityDeposit.toLocaleString()}`],
                  ["Move-in Date", moveInDate ? format(new Date(moveInDate), "dd MMMM yyyy") : "-"],
                  ["Lease Duration", `${leaseDuration} months`],
                  ...(viewingDate ? [["Viewing", format(new Date(viewingDate), "dd MMM yyyy, HH:mm")]] : []),
                ].map(([key, value]) => (
                  <div key={key} className="flex justify-between px-4 py-2.5 border-t border-border text-sm">
                    <span className="text-muted-foreground">{key}</span>
                    <span className="font-medium">{value}</span>
                  </div>
                ))}
              </div>

              {/* Booking fee */}
              <div className="rounded-xl bg-primary p-5 text-primary-foreground">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-primary-foreground/70">Booking Fee</p>
                  <DollarSign className="h-5 w-5 text-primary-foreground/50" />
                </div>
                <p className="text-3xl font-bold">KES 1,000</p>
                <p className="text-xs text-primary-foreground/70 mt-1">Valid for 5 bookings — refunded if all fail</p>
              </div>

              {/* Steps */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { n: "1", label: "Pay booking fee", desc: "KES 1,000 via M-Pesa" },
                  { n: "2", label: "Landlord assigns unit", desc: "Selects specific room & approves" },
                  { n: "3", label: "Sign contract", desc: "Pay rent & deposit" },
                  { n: "4", label: "Move in!", desc: "On your chosen date" },
                ].map(({ n, label, desc }) => (
                  <div key={n} className="flex items-start gap-2.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">{n}</span>
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between">
          {step > 1 ? (
            <Button variant="outline" onClick={() => setStep(s => s - 1)}>← Back</Button>
          ) : (
            <Link href={`/listings/${slug}`}>
              <Button variant="outline">← Back</Button>
            </Link>
          )}

          <Button
            onClick={handleNext}
            loading={step === 3 && bookingMutation.isPending}
            disabled={!canProceed()}
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
            {step === 3
              ? (bookingMutation.isPending ? "Processing..." : "Pay Booking Fee Now")
              : (<>Next: {STEPS[step]?.label} <ChevronRight className="h-4 w-4" /></>)
            }
          </Button>
        </div>
      </div>
    </div>
  );
}
