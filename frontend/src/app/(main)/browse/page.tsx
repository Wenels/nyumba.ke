"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Search, SlidersHorizontal, MapPin, BedDouble, Bath,
  ShieldCheck, ImageOff, Grid3X3, List, Map as MapIcon,
  ChevronDown, X, Navigation
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useListings } from "@/app/features/listings/hooks/use-listings";
import { useDebounce } from "@/hooks/use-debounce";
import type { Listing } from "@/app/features/listings/hooks/use-listings";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const AREAS = ["Westlands", "Kilimani", "Karen", "Lavington", "Kasarani", "Roysambu", "Parklands", "Eastleigh"];
const PROPERTY_TYPES = ["Bedsitter", "1 Bedroom", "2 Bedrooms", "3 Bedrooms", "4+ Bedrooms", "Bungalow", "Maisonette"];
const SORT_OPTIONS = ["Newest", "Price: Low to High", "Price: High to Low"];

function MapPanel({ listings }: { listings: Listing[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    import("leaflet").then((L) => {
      if (!mapRef.current || (mapRef.current as any)._leaflet_id) {
        // Update markers if map exists
        if (mapInstanceRef.current) {
          mapInstanceRef.current.eachLayer((layer: any) => {
            if (layer instanceof L.Marker) mapInstanceRef.current.removeLayer(layer);
          });
          listings.forEach((listing) => {
            if (!listing.latitude || !listing.longitude) return;
            const icon = L.divIcon({
              className: "",
              html: `<div style="background:#1a5c3a;color:white;padding:3px 8px;border-radius:12px;font-size:11px;font-weight:600;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.3)">KSh ${Math.round(listing.price / 1000)}K</div>`,
              iconAnchor: [25, 12],
            });
            L.marker([listing.latitude, listing.longitude], { icon })
              .addTo(mapInstanceRef.current)
              .bindPopup(`<b>${listing.title}</b><br/>${listing.address}`);
          });
        }
        return;
      }

      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current!, { center: [-1.2921, 36.8219], zoom: 12 });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
      }).addTo(map);

      listings.forEach((listing) => {
        if (!listing.latitude || !listing.longitude) return;
        const icon = L.divIcon({
          className: "",
          html: `<div style="background:#1a5c3a;color:white;padding:3px 8px;border-radius:12px;font-size:11px;font-weight:600;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.3)">KSh ${Math.round(listing.price / 1000)}K</div>`,
          iconAnchor: [25, 12],
        });
        L.marker([listing.latitude, listing.longitude], { icon })
          .addTo(map)
          .bindPopup(`<b>${listing.title}</b><br/>${listing.address}`);
      });

      mapInstanceRef.current = map;
      setTimeout(() => map.invalidateSize(), 100);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div ref={mapRef} className="h-full w-full" />
  );
}

function BrowseContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [area, setArea] = useState(searchParams.get("area") || "");
  const [activeArea, setActiveArea] = useState(searchParams.get("area") || "");
  const [propertyType, setPropertyType] = useState("");
  const [minPrice, setMinPrice] = useState<number | undefined>();
  const [maxPrice, setMaxPrice] = useState<number | undefined>();
  const [bedrooms, setBedrooms] = useState<number | undefined>();
  const [sort, setSort] = useState("Newest");
  const [view, setView] = useState<"list" | "grid" | "map">("list");
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [showMap, setShowMap] = useState(true);

  // Debounce typed area input — 400ms prevents hammering the API on every keystroke
  const debouncedArea = useDebounce(area, 400);

  // Sync debounced typed input into activeArea (dropdown sets it instantly)
  useEffect(() => {
    setActiveArea(debouncedArea);
  }, [debouncedArea]);

  const { data, isLoading, isError } = useListings({
    area: activeArea,
    propertyType,
    minPrice,
    maxPrice,
    bedrooms,
  });

  useEffect(() => {
    const areaParam = searchParams.get("area");
    if (areaParam) { setArea(areaParam); setActiveArea(areaParam); }
  }, [searchParams]);

  let listings: Listing[] = data?.listings ?? [];

  // Sort
  if (sort === "Price: Low to High") listings = [...listings].sort((a, b) => a.price - b.price);
  if (sort === "Price: High to Low") listings = [...listings].sort((a, b) => b.price - a.price);

  const vacantCount = listings.length;

  function clearFilters() {
    setArea(""); setActiveArea(""); setPropertyType("");
    setMinPrice(undefined); setMaxPrice(undefined); setBedrooms(undefined);
  }

  const hasFilters = activeArea || propertyType || minPrice || maxPrice || bedrooms;

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Top search bar */}
      <div className="border-b border-border bg-background px-4 py-3 shrink-0">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-lg font-bold">Explore Properties</h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <span>{listings.length} properties in view</span>
                {vacantCount > 0 && (
                  <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-primary font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {vacantCount} with vacancies
                  </span>
                )}
              </p>
            </div>

            <Button variant="outline" size="sm" className="gap-2 hidden sm:flex"
              onClick={() => setShowMap(!showMap)}>
              <MapIcon className="h-4 w-4" />
              {showMap ? "Hide Map" : "Show Map"}
            </Button>
          </div>

          {/* Search row */}
          <div className="mt-3 flex gap-2 flex-wrap">
            {/* Live search bar — debounced, no Enter needed */}
            <div className="relative flex-1 min-w-48">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={area} onChange={(e) => { setArea(e.target.value); }}
                placeholder="Type area, estate, property name..."
                className="pl-9 pr-9" />
              {area && (
                <button
                  type="button"
                  onClick={() => { setArea(""); setActiveArea(""); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Clear"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Area dropdown */}
            <select value={activeArea} onChange={(e) => { setActiveArea(e.target.value); setArea(e.target.value); }}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm min-w-32">
              <option value="">All Wards</option>
              {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>

            {/* Type dropdown */}
            <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm min-w-32">
              <option value="">All Types</option>
              {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>

            {/* More filters */}
            <Button variant="outline" size="sm" className="gap-1.5"
              onClick={() => setShowMoreFilters(!showMoreFilters)}>
              <SlidersHorizontal className="h-4 w-4" />
              More
              <ChevronDown className={`h-3 w-3 transition-transform ${showMoreFilters ? "rotate-180" : ""}`} />
            </Button>

            {/* View toggle */}
            <div className="flex rounded-md border border-border bg-muted p-0.5">
              {([
                { v: "list" as const, icon: List },
                { v: "grid" as const, icon: Grid3X3 },
                { v: "map" as const, icon: MapIcon },
              ]).map(({ v, icon: Icon }) => (
                <button key={v} onClick={() => setView(v)}
                  className={`flex h-8 w-8 items-center justify-center rounded transition-colors ${
                    view === v ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}>
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>

            {/* Sort */}
            <select value={sort} onChange={(e) => setSort(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm">
              {SORT_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Expanded filters */}
          {showMoreFilters && (
            <div className="mt-3 flex gap-3 flex-wrap items-end border-t border-border pt-3">
              <div>
                <p className="text-xs font-medium mb-1">Unit Type</p>
                <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)}
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">All Units</option>
                  {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <p className="text-xs font-medium mb-1">Min Rent (KSh)</p>
                <Input type="number" placeholder="5,000" value={minPrice ?? ""}
                  onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-32" />
              </div>
              <div>
                <p className="text-xs font-medium mb-1">Max Rent (KSh)</p>
                <Input type="number" placeholder="Any" value={maxPrice ?? ""}
                  onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-32" />
              </div>
              <div>
                <p className="text-xs font-medium mb-1">Bedrooms</p>
                <div className="flex gap-1">
                  {[0, 1, 2, 3, 4].map((n) => (
                    <button key={n} onClick={() => setBedrooms(bedrooms === n ? undefined : n)}
                      className={`h-9 w-12 rounded-md border text-sm font-medium transition-colors ${
                        bedrooms === n ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary"
                      }`}>
                      {n === 0 ? "St" : n === 4 ? "4+" : n}
                    </button>
                  ))}
                </div>
              </div>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5 text-destructive">
                  <X className="h-3.5 w-3.5" /> Clear all
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main split view */}
      <div className="flex flex-1 overflow-hidden">
        {/* Listings panel */}
        <div className={`flex flex-col overflow-y-auto ${
          view === "map" ? "hidden" : showMap ? "w-full sm:w-[420px] shrink-0" : "flex-1"
        }`}>
          {isLoading ? (
            <div className="space-y-3 p-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          ) : isError ? (
            <div className="p-6 text-center text-destructive">Failed to load listings.</div>
          ) : listings.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Search className="mx-auto h-10 w-10 mb-3 opacity-30" />
              <p className="font-semibold">No listings found</p>
              <p className="text-sm mt-1">Try a different area or filter</p>
            </div>
          ) : view === "grid" ? (
            <div className="grid grid-cols-2 gap-3 p-4">
              {listings.map((listing) => (
                <GridCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="space-y-0 divide-y divide-border">
              {listings.map((listing) => (
                <ListCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </div>

        {/* Map panel */}
        {(showMap || view === "map") && (
          <div className={`relative flex-1 ${view !== "map" && "hidden sm:block"}`}>
            <MapPanel listings={listings} />
            {/* Nairobi Wards toggle */}
            <div className="absolute top-3 right-3 z-10">
              <button className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-md hover:bg-primary/90 transition-colors">
                <Navigation className="h-3.5 w-3.5" />
                Nairobi Wards
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// List view card
function ListCard({ listing }: { listing: Listing }) {
  const photo = listing.photos?.[0];
  return (
    <div className="flex gap-3 p-3 hover:bg-muted/50 transition-colors">
      <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-lg bg-muted">
        {photo ? (
          <Image src={`${API_URL}${photo.url}`} alt={listing.title} fill sizes="128px" className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ImageOff className="h-5 w-5 text-muted-foreground/40" />
          </div>
        )}
        {listing.landlord?.verification === "VERIFIED" && (
          <span className="absolute left-1.5 top-1.5 flex items-center gap-0.5 rounded-full bg-primary px-1.5 py-0.5 text-xs font-medium text-primary-foreground">
            <ShieldCheck className="h-2.5 w-2.5" />
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{listing.title}</p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5 truncate">
              <MapPin className="h-3 w-3 shrink-0" />{listing.address}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span className="text-xs font-medium text-primary">4 Vacant</span>
          </div>
        </div>
        <p className="mt-1 text-base font-bold text-secondary">
          from KSh {listing.price.toLocaleString()}<span className="text-xs font-normal text-muted-foreground">/mo</span>
        </p>
        <div className="mt-1.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-0.5"><BedDouble className="h-3 w-3" />{listing.bedrooms}</span>
            <span className="flex items-center gap-0.5"><Bath className="h-3 w-3" />{listing.bathrooms}</span>
            <span className="text-muted-foreground/50">{listing.propertyType}</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/listings/${listing.slug}`}>
              <Button size="sm" className="h-7 text-xs bg-primary text-primary-foreground hover:bg-primary/90">
                View Units
              </Button>
            </Link>
            <button className="text-muted-foreground hover:text-primary transition-colors">
              <MapPin className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Grid view card
function GridCard({ listing }: { listing: Listing }) {
  const photo = listing.photos?.[0];
  return (
    <Link href={`/listings/${listing.slug}`} className="group block overflow-hidden rounded-xl border border-border bg-card hover:shadow-md transition-shadow">
      <div className="relative aspect-[4/3] bg-muted">
        {photo ? (
          <Image src={`${API_URL}${photo.url}`} alt={listing.title} fill sizes="200px" className="object-cover group-hover:scale-105 transition-transform" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ImageOff className="h-6 w-6 text-muted-foreground/40" />
          </div>
        )}
        <span className="absolute top-2 right-2 flex items-center gap-0.5 rounded-full bg-primary/90 px-2 py-0.5 text-xs font-medium text-primary-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-white" /> 4 Vacant
        </span>
        {listing.landlord?.verification === "VERIFIED" && (
          <span className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
            <ShieldCheck className="h-3 w-3" /> Verified
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="font-semibold text-sm truncate">{listing.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 truncate flex items-center gap-1">
          <MapPin className="h-3 w-3 shrink-0" />{listing.address}
        </p>
        <p className="mt-1.5 font-bold text-secondary text-sm">
          KSh {listing.price.toLocaleString()}<span className="text-xs font-normal text-muted-foreground">/mo</span>
        </p>
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-0.5"><BedDouble className="h-3 w-3" />{listing.bedrooms} bed</span>
          <span className="flex items-center gap-0.5"><Bath className="h-3 w-3" />{listing.bathrooms} bath</span>
        </div>
      </div>
    </Link>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    }>
      <BrowseContent />
    </Suspense>
  );
}