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
  Map as MapIcon,
} from "lucide-react";
import Image from "next/image";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/app/features/auth/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { MapView } from "@/app/features/listings/components/map-view";

interface Amenity {
  id: string;
  name: string;
  available: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const TABS = ["Overview", "Units & Pricing", "Amenities", "Condition Report", "Map"];

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
        <h3 className="font-semibold text-lg">Report Listing</h3>
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
    queryFn: () => api.get(`/api/listings/${slug}`) as Promise<{ listing: any }>,
    enabled: !!slug,
  });

  const { data: amenitiesData } = useQuery({
    queryKey: ["amenities", data?.listing?.id],
    queryFn: () => api.get(`/api/listings/${data!.listing.id}/amenities`) as Promise<{ amenities: Amenity[] }>,
    enabled: !!data?.listing?.id,
  });

  const { data: conditionData } = useQuery({
    queryKey: ["condition", data?.listing?.id],
    queryFn: () => api.get(`/api/listings/${data!.listing.id}/condition`) as Promise<{ report: any }>,
    enabled: !!data?.listing?.id,
  });

  const listing = data?.listing;
  const amenities: Amenity[] = amenitiesData?.amenities ?? [];
  const condition = conditionData?.report;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-10 space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="aspect-[16/9] animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  if (isError || !listing) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <p className="text-lg font-semibold">Listing not found</p>
        <Link href="/browse" className="mt-3 text-sm text-primary hover:underline">← Back to browse</Link>
      </div>
    );
  }

  const landlord = listing.landlord;
  const confirmedAmenities = amenities.filter((a) => a.available).length;
  const notFoundAmenities = amenities.filter((a) => !a.available).length;

  return (
    <div className="min-h-screen bg-background">
      {showReport && <ReportModal listingId={listing.id} onClose={() => setShowReport(false)} />}

      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* Back + actions */}
        <div className="mb-4 flex items-center justify-between gap-4">
          <button onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Explore
          </button>
          <div className="flex items-center gap-2">
            {user && <SaveButton listing={listing} />}
            <button onClick={() => setShowReport(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border hover:border-destructive hover:text-destructive transition-colors">
              <Flag className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold">{listing.title}</h1>
                {landlord?.verification === "VERIFIED" && (
                  <span className="flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
                    <ShieldCheck className="h-3 w-3" /> Verified
                  </span>
                )}
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                  {listing.status === "ACTIVE" ? "4 vacant units" : listing.status}
                </span>
              </div>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" />{listing.address}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-2xl font-bold text-secondary">
                from KSh {listing.price.toLocaleString()}
                <span className="text-sm font-normal text-muted-foreground">/mo</span>
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
          {/* Main content */}
          <div className="space-y-6">
            {/* Photo carousel */}
            <PhotoCarousel photos={listing.photos} title={listing.title} />

            {/* Stat cards */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: Home, label: "Property Type", value: listing.propertyType },
                { icon: Users, label: "Total Units", value: `${listing.bedrooms} units`, sub: "4 vacant" },
                { icon: DollarSign, label: "Rent Range", value: `KSh ${listing.price.toLocaleString()}`, sub: "/month" },
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
                    {tab === "Amenities" && amenities.length > 0 && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                    )}
                    {tab === "Condition Report" && condition && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
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
                  <p className="text-sm text-muted-foreground leading-relaxed">{listing.description}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-3">Property Details</h3>
                  <div className="rounded-xl border border-border overflow-hidden">
                    {[
                      ["Property Type", listing.propertyType],
                      ["Bedrooms", listing.bedrooms],
                      ["Bathrooms", listing.bathrooms],
                      ["Address", listing.address],
                      ["Status", listing.status],
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
                <div>
                  <h3 className="font-semibold mb-3">Lease Terms</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: Calendar, label: "Available From", value: "Immediately" },
                      { icon: Calendar, label: "Minimum Lease", value: "6 months" },
                      { icon: DollarSign, label: "Security Deposit", value: `KSh ${listing.price.toLocaleString()}` },
                      { icon: Calendar, label: "Expires", value: new Date(listing.expiresAt).toLocaleDateString("en-KE") },
                    ].map(({ icon: Icon, label, value }) => (
                      <div key={label} className="rounded-lg border border-border p-3">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                          <Icon className="h-3.5 w-3.5" />
                          <span className="text-xs">{label}</span>
                        </div>
                        <p className="text-sm font-semibold">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "Units & Pricing" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Vacant Units</h3>
                  <span className="text-xs text-muted-foreground">4 vacant units</span>
                </div>
                {/* Sample unit cards — in production these come from the booking model */}
                {[
                  { type: listing.propertyType, rent: listing.price, deposit: listing.price, vacant: 4 },
                ].map((unit, i) => (
                  <div key={i} className="rounded-xl border border-border bg-card p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold">{unit.type}</h4>
                      <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                        {unit.vacant} vacant
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                      <div>
                        <p className="text-muted-foreground text-xs">Monthly Rent</p>
                        <p className="font-bold text-lg">KSh {unit.rent.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Security Deposit</p>
                        <p className="font-bold text-lg">KSh {unit.deposit.toLocaleString()}</p>
                      </div>
                    </div>
                    {user ? (
                      <Link href={`/listings/${listing.slug}/book`}>
                        <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                          Book This Unit
                        </Button>
                      </Link>
                    ) : (
                      <Link href="/login">
                        <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                          Sign in to Book
                        </Button>
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === "Amenities" && (
              <div className="space-y-4">
                {amenities.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
                    <p>No amenities listed yet</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { label: "Confirmed", value: confirmedAmenities, color: "text-primary bg-primary/10 border-primary/20" },
                        { label: "Not Found", value: notFoundAmenities, color: "text-destructive bg-destructive/10 border-destructive/20" },
                        { label: "Total Checked", value: amenities.length, color: "text-foreground bg-muted border-border" },
                      ].map(({ label, value, color }) => (
                        <div key={label} className={`rounded-xl border p-4 text-center ${color}`}>
                          <p className="text-2xl font-bold">{value}</p>
                          <p className="text-xs mt-1">{label}</p>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      {amenities.map((amenity) => (
                        <div key={amenity.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
                          <div className="flex items-center gap-3">
                            {amenity.available
                              ? <CheckCircle2 className="h-4 w-4 text-primary" />
                              : <XCircle className="h-4 w-4 text-destructive" />}
                            <span className="text-sm font-medium">{amenity.name}</span>
                          </div>
                          <span className={`text-xs font-semibold ${amenity.available ? "text-primary" : "text-destructive"}`}>
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
              <div className="space-y-4">
                {!condition ? (
                  <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
                    <p>No condition report available</p>
                  </div>
                ) : (
                  <>
                    <div className={`rounded-xl border p-4 flex items-center gap-3 ${
                      condition.allPassed ? "border-primary/20 bg-primary/5" : "border-secondary/20 bg-secondary/5"
                    }`}>
                      <CheckCircle2 className={`h-5 w-5 ${condition.allPassed ? "text-primary" : "text-secondary"}`} />
                      <p className="font-medium text-sm">
                        {condition.allPassed ? "All items passed — no issues found" : "Some items need attention"}
                      </p>
                    </div>
                    {["floors", "utilities", "walls"].map((section) => {
                      const data = condition[section];
                      if (!data?.items) return null;
                      const allClear = data.items.every((i: any) => i.status === "No issues");
                      return (
                        <div key={section} className="rounded-xl border border-border overflow-hidden">
                          <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-3">
                            <h4 className="font-semibold capitalize">{section}</h4>
                            <span className={`text-xs font-medium flex items-center gap-1 ${allClear ? "text-primary" : "text-secondary"}`}>
                              <CheckCircle2 className="h-3 w-3" /> {allClear ? "All clear" : "Issues found"}
                            </span>
                          </div>
                          {data.items.map((item: any) => (
                            <div key={item.name} className="flex items-center justify-between px-4 py-3 border-b border-border last:border-0">
                              <div className="flex items-center gap-3">
                                <CheckCircle2 className="h-4 w-4 text-primary" />
                                <span className="text-sm">{item.name}</span>
                              </div>
                              <span className={`text-xs font-medium rounded-full px-2.5 py-0.5 ${
                                item.status === "No issues" ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"
                              }`}>{item.status}</span>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            )}

            {activeTab === "Map" && (
              <div className="h-80 overflow-hidden rounded-xl border border-border">
                <MapView lat={listing.latitude} lng={listing.longitude} />
              </div>
            )}
          </div>

          {/* Right sidebar — Landlord card */}
          <div className="space-y-4">
            {/* Book Now CTA */}
            {user && listing.status === "ACTIVE" && (
              <Link href={`/listings/${listing.slug}/book`}>
                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-base font-semibold">
                  Book Now
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
                <a href={`https://wa.me/254${landlord.phone.replace(/^0/, "").replace(/\D/g, "")}?text=Hi, I'm interested in ${listing.title}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm font-medium text-primary hover:bg-primary/10 transition-colors w-full">
                  <MessageSquare className="h-4 w-4" /> Contact via WhatsApp
                </a>
              )}

              {/* Save */}
              {user && (
                <SaveButton listing={listing} />
              )}

              <p className="text-center text-xs text-muted-foreground">
                No agent fees — contact directly
              </p>

              <div className="border-t border-border pt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                Listed {new Date(listing.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })}
              </div>
            </div>

            {/* Specs */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <h3 className="font-semibold text-sm">Property Specs</h3>
              {[
                { icon: BedDouble, label: "Bedrooms", value: listing.bedrooms },
                { icon: Bath, label: "Bathrooms", value: listing.bathrooms },
                { icon: Home, label: "Type", value: listing.propertyType },
                { icon: MapPin, label: "Location", value: listing.address },
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