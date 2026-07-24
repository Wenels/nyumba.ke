"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft, MapPin, BedDouble, Bath, ShieldCheck, Heart,
  Phone, MessageSquare, Flag, Calendar, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, Home, Users, DollarSign, ImageOff,
  Building2, Sparkles, Key, Check
} from "lucide-react";
import Image from "next/image";
import { api } from "@/lib/api";
import { useAuth } from "@/app/features/auth/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { MapView } from "@/app/features/listings/components/map-view";

interface Amenity {
  id: string;
  name: string;
  available: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const TABS = ["Overview", "Units & Pricing", "Inspection Photos", "Amenities", "Condition Report", "Map"];

// Photo carousel
function PhotoCarousel({ photos, title }: { photos: any[]; title: string }) {
  const [current, setCurrent] = useState(0);
  if (!photos?.length) {
    return (
      <div className="flex aspect-[16/9] w-full items-center justify-center rounded-xl bg-muted">
        <ImageOff className="h-12 w-12 text-muted-foreground" />
      </div>
    );
  }
  return (
    <div className="relative overflow-hidden rounded-xl">
      <div className="relative aspect-[16/9] w-full bg-muted">
        <Image src={`${API_URL}${photos[current].url}`} alt={`${title} ${current + 1}`}
          fill sizes="(max-width: 768px) 100vw, 800px" className="object-cover" priority={current === 0} />
        <span className="absolute bottom-4 right-4 rounded-full bg-foreground/70 px-3 py-1 text-xs text-background">
          {current + 1} / {photos.length}
        </span>
        {photos.length > 1 && (
          <>
            <button onClick={() => setCurrent(c => c === 0 ? photos.length - 1 : c - 1)}
              className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-background/80 hover:bg-background shadow-md transition-colors">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button onClick={() => setCurrent(c => c === photos.length - 1 ? 0 : c + 1)}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-background/80 hover:bg-background shadow-md transition-colors">
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
      {photos.length > 1 && (
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {photos.map((photo, i) => (
            <button key={photo.id} onClick={() => setCurrent(i)}
              className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                i === current ? "border-secondary" : "border-transparent"
              }`}>
              <Image src={`${API_URL}${photo.url}`} alt={`Thumb ${i + 1}`} fill sizes="96px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Save button
function SaveButton({ listing }: { listing: any }) {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["saved-check", listing.id],
    queryFn: () => fetch(`${API_URL}/api/saved/${listing.id}/check`, { credentials: "include" }).then(r => r.json()) as Promise<{ saved: boolean }>,
  });
  const isSaved = data?.saved ?? false;
  const mutation = useMutation({
    mutationFn: () => isSaved
      ? fetch(`${API_URL}/api/saved/${listing.id}`, { method: "DELETE", credentials: "include" })
      : fetch(`${API_URL}/api/saved/${listing.id}`, { method: "POST", credentials: "include" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-check", listing.id] });
      queryClient.invalidateQueries({ queryKey: ["saved"] });
      toast.success(isSaved ? "Removed from saved" : "Saved!");
    },
  });
  return (
    <button onClick={() => mutation.mutate()} disabled={mutation.isPending}
      className={`flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${
        isSaved ? "border-destructive/30 bg-destructive/5 text-destructive" : "border-border hover:border-secondary hover:text-secondary"
      }`}>
      <Heart className={`h-5 w-5 ${isSaved ? "fill-destructive" : ""}`} />
    </button>
  );
}

// Report modal
function ReportModal({ listingId, onClose }: { listingId: string; onClose: () => void }) {
  const [reportType, setReportType] = useState("SCAM");
  const [details, setDetails] = useState("");
  const mutation = useMutation({
    mutationFn: () => api.post(`/api/listings/${listingId}/report`, { reportType, reason: reportType, details }),
    onSuccess: () => { toast.success("Report submitted"); onClose(); },
    onError: () => toast.error("Failed to submit report"),
  });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-background p-6 shadow-xl">
        <h3 className="font-semibold text-lg">Report Property</h3>
        <p className="mt-1 text-sm text-muted-foreground">Help us keep Nyumba.ke safe</p>
        <div className="mt-4 space-y-3">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Reason</label>
            <select value={reportType} onChange={(e) => setReportType(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              {["SCAM", "WRONG_INFO", "ALREADY_RENTED", "INAPPROPRIATE", "OTHER"].map((t) => (
                <option key={t} value={t}>{t.replace("_", " ")}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Details (optional)</label>
            <textarea value={details} onChange={(e) => setDetails(e.target.value)}
              rows={3} placeholder="Provide more details..."
              className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? "Submitting..." : "Submit Report"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ListingDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("Overview");
  const [showReport, setShowReport] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["listings", slug],
    queryFn: () => api.get(`/api/listings/${slug}`) as Promise<{ listing: any; property: any }>,
    enabled: !!slug,
  });

  const property = data?.property || data?.listing;

  const { data: amenitiesData } = useQuery({
    queryKey: ["amenities", property?.id],
    queryFn: () => api.get(`/api/listings/${property.id}/amenities`) as Promise<{ amenities: Amenity[] }>,
    enabled: !!property?.id,
  });

  const { data: conditionData } = useQuery({
    queryKey: ["condition", property?.id],
    queryFn: () => api.get(`/api/listings/${property.id}/condition`) as Promise<{ report: any }>,
    enabled: !!property?.id,
  });

  const amenities: Amenity[] = amenitiesData?.amenities ?? property?.amenities ?? [];
  const condition = conditionData?.report || property?.conditionReport;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-10 space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="aspect-[16/9] animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  if (isError || !property) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <p className="text-lg font-semibold">Property not found</p>
        <Link href="/browse" className="mt-3 text-sm text-primary hover:underline">← Back to explore</Link>
      </div>
    );
  }

  const landlord = property.landlord;
  const unitTypes = property.unitTypes || [];
  const totalVacantCount = property.vacantCount ?? unitTypes.reduce((acc: number, ut: any) => {
    return acc + (ut.units?.filter((u: any) => u.status === "VACANT")?.length || 0);
  }, 0);

  const confirmedAmenities = amenities.filter((a) => a.available).length;
  const notFoundAmenities = amenities.filter((a) => !a.available).length;

  return (
    <div className="min-h-screen bg-background">
      {showReport && <ReportModal listingId={property.id} onClose={() => setShowReport(false)} />}

      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* Back + actions */}
        <div className="mb-4 flex items-center justify-between gap-4">
          <button onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Explore
          </button>
          <div className="flex items-center gap-2">
            {user && <SaveButton listing={property} />}
            <button onClick={() => setShowReport(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border hover:border-destructive hover:text-destructive transition-colors">
              <Flag className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Property Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold">{property.name || property.title}</h1>
                {landlord?.verification === "VERIFIED" && (
                  <span className="flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
                    <ShieldCheck className="h-3 w-3" /> Verified Building
                  </span>
                )}
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                  {totalVacantCount > 0 ? `${totalVacantCount} vacant units` : "Fully Occupied"}
                </span>
              </div>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" />{property.address}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-2xl font-bold text-secondary">
                from KSh {(property.minRent || property.price || 0).toLocaleString()}
                <span className="text-sm font-normal text-muted-foreground">/mo</span>
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
          {/* Main content */}
          <div className="space-y-6">
            {/* Building Photo Carousel */}
            <PhotoCarousel photos={property.photos} title={property.name || property.title} />

            {/* Stat cards */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: Building2, label: "Building Type", value: property.propertyType },
                { icon: Key, label: "Vacant Units", value: `${totalVacantCount} available`, sub: `out of ${property.totalUnits || 1} units` },
                { icon: DollarSign, label: "Rent Range", value: `KSh ${(property.minRent || property.price || 0).toLocaleString()}`, sub: property.maxRent && property.maxRent > property.minRent ? `up to KSh ${property.maxRent.toLocaleString()}` : "/month" },
              ].map(({ icon: Icon, label, value, sub }) => (
                <div key={label} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Icon className="h-4 w-4 text-secondary" />
                    <span className="text-xs">{label}</span>
                  </div>
                  <p className="font-bold text-lg leading-tight">{value}</p>
                  {sub && <p className="text-xs text-primary font-medium">{sub}</p>}
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div className="border-b border-border">
              <div className="flex gap-0 overflow-x-auto">
                {TABS.map((tab) => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                      activeTab === tab
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}>
                    {tab}
                    {tab === "Units & Pricing" && unitTypes.length > 0 && (
                      <span className="rounded-full bg-secondary/15 text-secondary text-xs px-1.5 py-0.5 font-bold">
                        {unitTypes.length}
                      </span>
                    )}
                    {tab === "Inspection Photos" && (
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
                        ✓
                      </span>
                    )}
                    {tab === "Amenities" && (
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
                        ✓
                      </span>
                    )}
                    {tab === "Condition Report" && (
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
                        ✓
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab content */}
            {activeTab === "Overview" && (
              <div className="space-y-5">
                <div>
                  <h3 className="font-semibold mb-2">About this property</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{property.description}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-3">Building Details</h3>
                  <div className="rounded-xl border border-border overflow-hidden">
                    {[
                      ["Property Type", property.propertyType],
                      ["Total Floors", property.totalFloors || 1],
                      ["Total Units", property.totalUnits || 1],
                      ["Address", property.address],
                      ["Management", property.managementType === "agent" ? `Agent (${property.agentName || "Managed"})` : "Owner Managed"],
                    ].map(([key, value], i) => (
                      <div key={String(key)} className={`flex items-center justify-between px-4 py-3 text-sm ${
                        i % 2 === 0 ? "bg-muted/30" : "bg-background"
                      }`}>
                        <span className="text-muted-foreground">{key}</span>
                        <span className="font-medium capitalize">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {property.rules && property.rules.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Building Rules</h3>
                    <div className="flex flex-wrap gap-2">
                      {property.rules.map((rule: string, i: number) => (
                        <span key={i} className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground flex items-center gap-1.5">
                          <Check className="h-3.5 w-3.5 text-primary" /> {rule}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3-Tier Units & Pricing Tab */}
            {activeTab === "Units & Pricing" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg">Unit Categories & Vacancies</h3>
                    <p className="text-xs text-muted-foreground">Select a unit type below to view details and book your spot.</p>
                  </div>
                  <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-full">
                    {totalVacantCount} total vacant units
                  </span>
                </div>

                {unitTypes.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
                    No unit categories defined for this building.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {unitTypes.map((ut: any) => {
                      const vacantUnits = ut.units?.filter((u: any) => u.status === "VACANT") || [];

                      return (
                        <div key={ut.id} className="rounded-xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                          {/* UnitType Header */}
                          <div className="p-5 border-b border-border bg-muted/20">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-xl text-foreground">{ut.label}</h4>
                                  <span className="rounded-full bg-secondary/15 px-2.5 py-0.5 text-xs font-semibold text-secondary">
                                    {ut.bedroomCount === 0 ? "Studio" : `${ut.bedroomCount} Bed`} • {ut.bathrooms} Bath
                                  </span>
                                </div>
                                {ut.description && (
                                  <p className="text-xs text-muted-foreground mt-1">{ut.description}</p>
                                )}
                              </div>

                              <div className="text-left sm:text-right">
                                <p className="text-xl font-extrabold text-secondary">
                                  KSh {ut.monthlyRent.toLocaleString()}
                                  <span className="text-xs font-normal text-muted-foreground">/mo</span>
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Deposit: KSh {ut.securityDeposit.toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* UnitType Content */}
                          <div className="p-5 space-y-4">
                            {/* Individual Vacant Rooms */}
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                                <Key className="h-3.5 w-3.5 text-primary" /> Vacant Rooms in this category ({vacantUnits.length}):
                              </p>
                              {vacantUnits.length === 0 ? (
                                <p className="text-xs text-destructive italic">Currently all units in this category are occupied or reserved.</p>
                              ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                  {vacantUnits.map((unit: any) => (
                                    <div key={unit.id} className="rounded-lg border border-primary/20 bg-primary/5 p-2.5 text-center">
                                      <p className="text-xs font-bold text-foreground">Unit {unit.unitNumber}</p>
                                      <p className="text-[11px] text-muted-foreground">Floor {unit.floor} {unit.doorNumber ? `(Door ${unit.doorNumber})` : ""}</p>
                                      {unit.rentOverride && (
                                        <p className="text-[11px] font-semibold text-secondary mt-0.5">KSh {unit.rentOverride.toLocaleString()}</p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Book CTA */}
                            <div className="pt-2 flex items-center justify-between gap-4 border-t border-border">
                              <span className="text-xs text-muted-foreground">
                                {vacantUnits.length > 0 ? `${vacantUnits.length} vacant room${vacantUnits.length > 1 ? "s" : ""} ready for move-in` : "Join waiting list"}
                              </span>
                              {user ? (
                                <Link href={`/listings/${property.slug}/book?unitTypeId=${ut.id}`}>
                                  <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-5">
                                    Book {ut.label}
                                  </Button>
                                </Link>
                              ) : (
                                <Link href="/login">
                                  <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-5">
                                    Sign in to Book
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Inspection Photos Tab (Categorized by House Area & Grouped by UnitType) */}
            {activeTab === "Inspection Photos" && (
              <InspectionPhotosTab property={property} />
            )}

            {activeTab === "Amenities" && (
              <div className="space-y-6">
                {amenities.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
                    <p className="font-medium text-sm">No inspection amenities verified for this property yet.</p>
                  </div>
                ) : (
                  <>
                    {/* Top Stat Summary Cards matching design screenshot */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Confirmed Card */}
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-5 text-center shadow-xs">
                        <p className="text-3xl font-extrabold text-emerald-600">{confirmedAmenities}</p>
                        <p className="text-xs font-semibold text-emerald-700/80 mt-1">Confirmed</p>
                      </div>

                      {/* Not Found Card */}
                      <div className="rounded-xl border border-red-200 bg-red-50/80 p-5 text-center shadow-xs">
                        <p className="text-3xl font-extrabold text-red-500">{notFoundAmenities}</p>
                        <p className="text-xs font-semibold text-red-500/80 mt-1">Not Found</p>
                      </div>

                      {/* Total Checked Card */}
                      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-5 text-center shadow-xs">
                        <p className="text-3xl font-extrabold text-slate-700">{amenities.length}</p>
                        <p className="text-xs font-semibold text-slate-500 mt-1">Total Checked</p>
                      </div>
                    </div>

                    {/* Verified Amenities List */}
                    <div className="space-y-3 pt-2">
                      {amenities.map((amenity) => (
                        <div
                          key={amenity.id}
                          className={`flex items-center justify-between rounded-xl border px-5 py-4 transition-colors ${
                            amenity.available
                              ? "border-emerald-200/80 bg-emerald-50/30 hover:bg-emerald-50/60"
                              : "border-red-200/80 bg-red-50/30 hover:bg-red-50/60"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`flex h-6 w-6 items-center justify-center rounded-full text-white text-xs font-bold ${
                                amenity.available ? "bg-emerald-500" : "bg-red-500"
                              }`}
                            >
                              {amenity.available ? "✓" : "✕"}
                            </span>
                            <span className="text-sm font-semibold text-foreground">{amenity.name}</span>
                          </div>

                          <span
                            className={`rounded-full px-3.5 py-1 text-xs font-bold ${
                              amenity.available
                                ? "bg-emerald-100/90 text-emerald-800 border border-emerald-200"
                                : "bg-red-100/90 text-red-800 border border-red-200"
                            }`}
                          >
                            {amenity.available ? "Available" : "Not Found"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === "Condition Report" && (
              <div className="space-y-6">
                {!condition ? (
                  <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
                    <p className="font-medium text-sm">No official Nyumba.ke inspection report filed yet.</p>
                  </div>
                ) : (
                  <>
                    {/* Top Status Banner matching user screenshot */}
                    <div className={`rounded-2xl border p-5 flex items-center gap-4 ${
                      condition.allPassed ? "border-emerald-200 bg-emerald-50/70" : "border-amber-200 bg-amber-50/70"
                    }`}>
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white font-bold text-sm ${
                        condition.allPassed ? "bg-emerald-600" : "bg-amber-600"
                      }`}>
                        ✓
                      </span>
                      <div>
                        <p className="font-bold text-base text-foreground">
                          {condition.allPassed ? "Verified Passed — Official Inspection Clear" : "Inspection Notice — Attention Items"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Inspected by certified Nyumba.ke field agents.
                        </p>
                      </div>
                    </div>

                    {/* Inspection Sections matching user screenshot */}
                    {["floors", "utilities", "walls"].map((section) => {
                      const data = condition[section];
                      if (!data?.items) return null;
                      const allClear = data.items.every((i: any) => i.status === "No issues");
                      return (
                        <div key={section} className="rounded-2xl border border-border/80 overflow-hidden bg-card shadow-2xs">
                          {/* Section Header */}
                          <div className="flex items-center justify-between border-b border-border/60 bg-muted/20 px-5 py-4">
                            <h4 className="font-bold text-base capitalize text-foreground">{section}</h4>
                            <span className={`text-xs font-bold flex items-center gap-1.5 ${allClear ? "text-emerald-600" : "text-amber-600"}`}>
                              <span className={`flex h-4 w-4 items-center justify-center rounded-full text-white text-[10px] font-bold ${
                                allClear ? "bg-emerald-600" : "bg-amber-600"
                              }`}>
                                ✓
                              </span>
                              {allClear ? "All clear" : "Issues flagged"}
                            </span>
                          </div>

                          {/* Section Items */}
                          <div className="divide-y divide-border/60">
                            {data.items.map((item: any) => (
                              <div key={item.name} className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-muted/10">
                                <div className="flex items-center gap-3">
                                  <span className={`flex h-5 w-5 items-center justify-center rounded-full text-white text-xs font-bold ${
                                    item.status === "No issues" ? "bg-emerald-500" : "bg-amber-500"
                                  }`}>
                                    ✓
                                  </span>
                                  <span className="text-sm font-semibold text-foreground">{item.name}</span>
                                </div>
                                <span className={`text-xs font-bold rounded-full px-3.5 py-1 ${
                                  item.status === "No issues"
                                    ? "bg-emerald-100/90 text-emerald-800 border border-emerald-200"
                                    : "bg-amber-100/90 text-amber-800 border border-amber-200"
                                }`}>
                                  {item.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            )}

            {activeTab === "Map" && (
              <div className="h-80 overflow-hidden rounded-xl border border-border">
                <MapView lat={property.latitude} lng={property.longitude} />
              </div>
            )}
          </div>

          {/* Right sidebar — Landlord card */}
          <div className="space-y-4">
            {/* Book Now CTA */}
            {user && (
              <Link href={`/listings/${property.slug}/book`}>
                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-base font-semibold">
                  Book Unit Spot
                </Button>
              </Link>
            )}
            {!user && (
              <Link href="/login">
                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-base font-semibold">
                  Sign in to Book
                </Button>
              </Link>
            )}

            {/* Landlord card */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">
                  {landlord?.fullName?.charAt(0) ?? "L"}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold truncate">{landlord?.fullName}</p>
                  {landlord?.verification === "VERIFIED" && (
                    <span className="flex items-center gap-1 text-xs text-primary font-medium">
                      <ShieldCheck className="h-3 w-3" /> Verified Landlord
                    </span>
                  )}
                </div>
              </div>

              {landlord?.phone ? (
                <a href={`tel:${landlord.phone}`}
                  className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors w-full">
                  <Phone className="h-4 w-4" /> Call {landlord.phone}
                </a>
              ) : (
                <div className="flex items-center justify-center gap-2 rounded-lg bg-muted px-4 py-2.5 text-sm text-muted-foreground w-full">
                  <Phone className="h-4 w-4" /> No phone listed
                </div>
              )}

              {landlord?.phone && (
                <a href={`https://wa.me/254${landlord.phone.replace(/^0/, "").replace(/\D/g, "")}?text=Hi, I'm interested in ${property.name || property.title}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm font-medium text-primary hover:bg-primary/10 transition-colors w-full">
                  <MessageSquare className="h-4 w-4" /> Contact via WhatsApp
                </a>
              )}

              <p className="text-center text-xs text-muted-foreground">
                No agent fees — contact directly
              </p>

              <div className="border-t border-border pt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                Listed {new Date(property.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })}
              </div>
            </div>

            {/* Specs */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <h3 className="font-semibold text-sm">Property Specs</h3>
              {[
                { icon: Building2, label: "Property Type", value: property.propertyType },
                { icon: Key, label: "Total Units", value: property.totalUnits || 1 },
                { icon: MapPin, label: "Location", value: property.address },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Icon className="h-3.5 w-3.5" />{label}
                  </div>
                  <span className="font-medium truncate max-w-32 text-right">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InspectionPhotosTab({ property }: { property: any }) {
  const [selectedUnitTypeId, setSelectedUnitTypeId] = useState<string>("ALL");
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  const unitTypes = property.unitTypes || [];

  // Aggregate photos based on selected UnitType filter
  const activePhotos: Array<{ id: string; url: string; category: string; unitTypeLabel?: string }> = [];

  if (selectedUnitTypeId === "ALL") {
    (property.photos || []).forEach((p: any) => {
      activePhotos.push({
        id: p.id,
        url: p.url,
        category: p.category || "Exterior / Compound",
        unitTypeLabel: "Building",
      });
    });
    unitTypes.forEach((ut: any) => {
      (ut.photos || []).forEach((p: any) => {
        activePhotos.push({
          id: p.id,
          url: p.url,
          category: p.category || "General",
          unitTypeLabel: ut.label,
        });
      });
      (ut.units || []).forEach((u: any) => {
        (u.photos || []).forEach((p: any) => {
          activePhotos.push({
            id: p.id,
            url: p.url,
            category: p.category || "General",
            unitTypeLabel: `${ut.label} (Unit ${u.unitNumber})`,
          });
        });
      });
    });
  } else if (selectedUnitTypeId === "BUILDING") {
    (property.photos || []).forEach((p: any) => {
      activePhotos.push({
        id: p.id,
        url: p.url,
        category: p.category || "Exterior / Compound",
        unitTypeLabel: "Building",
      });
    });
  } else {
    const targetUt = unitTypes.find((ut: any) => ut.id === selectedUnitTypeId);
    if (targetUt) {
      (targetUt.photos || []).forEach((p: any) => {
        activePhotos.push({
          id: p.id,
          url: p.url,
          category: p.category || "General",
          unitTypeLabel: targetUt.label,
        });
      });
      (targetUt.units || []).forEach((u: any) => {
        (u.photos || []).forEach((p: any) => {
          activePhotos.push({
            id: p.id,
            url: p.url,
            category: p.category || "General",
            unitTypeLabel: `${targetUt.label} (Unit ${u.unitNumber})`,
          });
        });
      });
    }
  }

  // Category display order matching standard inspection layout
  const CATEGORY_ORDER = [
    "Living Area",
    "Kitchen",
    "Master Bedroom",
    "Bedroom",
    "Bathroom",
    "Exterior / Compound",
    "Shared Areas",
    "General",
  ];

  // Group photos by house area category
  const groupedCategories: Record<string, typeof activePhotos> = {};
  activePhotos.forEach((photo) => {
    const cat = photo.category || "General";
    if (!groupedCategories[cat]) groupedCategories[cat] = [];
    groupedCategories[cat].push(photo);
  });

  const categoryKeys = Object.keys(groupedCategories).sort((a, b) => {
    const ia = CATEGORY_ORDER.indexOf(a);
    const ib = CATEGORY_ORDER.indexOf(b);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.localeCompare(b);
  });

  return (
    <div className="space-y-8">
      {/* Unit Type Filter Pills (Grouped in Unit Type) */}
      {unitTypes.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Select Unit Category</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedUnitTypeId("ALL")}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                selectedUnitTypeId === "ALL"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              All Unit Categories
            </button>

            {unitTypes.map((ut: any) => (
              <button
                key={ut.id}
                onClick={() => setSelectedUnitTypeId(ut.id)}
                className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                  selectedUnitTypeId === ut.id
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {ut.label}
              </button>
            ))}

            {property.photos?.length > 0 && (
              <button
                onClick={() => setSelectedUnitTypeId("BUILDING")}
                className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                  selectedUnitTypeId === "BUILDING"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                Building & Shared
              </button>
            )}
          </div>
        </div>
      )}

      {/* Categorized House Area Photo Sections (Matching user mockup) */}
      {categoryKeys.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
          <p className="font-medium text-sm">No inspection photos filed for this category yet.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {categoryKeys.map((catName) => {
            const photos = groupedCategories[catName];
            return (
              <div key={catName} className="space-y-4">
                {/* Category Header with count badge matching screenshot */}
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg text-foreground">{catName}</h3>
                  <span className="flex h-5 px-2 items-center justify-center rounded-full bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
                    {photos.length}
                  </span>
                </div>

                {/* 3-Column Image Grid matching screenshot */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {photos.map((photo, i) => (
                    <div
                      key={photo.id || i}
                      onClick={() => setPreviewPhoto(photo.url)}
                      className="group relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border/60 bg-muted shadow-xs transition-transform duration-200 hover:scale-[1.01] hover:shadow-md cursor-pointer"
                    >
                      <Image
                        src={`${API_URL}${photo.url}`}
                        alt={`${catName} Photo ${i + 1}`}
                        fill
                        sizes="(max-width: 768px) 100vw, 350px"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {previewPhoto && (
        <div
          onClick={() => setPreviewPhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs"
        >
          <div className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-2xl">
            <img
              src={`${API_URL}${previewPhoto}`}
              alt="Inspection Photo Preview"
              className="max-h-[85vh] max-w-[85vw] object-contain rounded-2xl"
            />
            <button
              onClick={() => setPreviewPhoto(null)}
              className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}