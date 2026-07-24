"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  SlidersHorizontal,
  ArrowRight,
  MapPin,
  BedDouble,
  Bath,
  ShieldCheck,
  ImageOff,
  X,
  Sparkles,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useListings } from "@/app/features/listings/hooks/use-listings";
import { useDebounce } from "@/hooks/use-debounce";
import type { Listing } from "@/app/features/listings/hooks/use-listings";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const AREAS = [
  "Westlands",
  "Kilimani",
  "Karen",
  "Lavington",
  "Kasarani",
  "Roysambu",
];

const PROPERTY_TYPES = [
  "Bedsitter",
  "1 Bedroom",
  "2 Bedrooms",
  "3 Bedrooms",
  "4+ Bedrooms",
  "Bungalow",
  "Maisonette",
  "Studio",
  "Apartment",
];

export function LatestListings() {
  const [areaInput, setAreaInput] = useState("");
  const [pillArea, setPillArea] = useState(""); // area set via pills (instant)
  const [propertyType, setPropertyType] = useState("");
  const [minPrice, setMinPrice] = useState<number | undefined>();
  const [maxPrice, setMaxPrice] = useState<number | undefined>();
  const [bedrooms, setBedrooms] = useState<number | undefined>();

  // Debounce the typed input by 400 ms so we don't hammer the API on every keystroke
  const debouncedTypedArea = useDebounce(areaInput, 400);

  // Pills set instantly; typed input is debounced — whichever was last used wins.
  // We prefer pillArea when it's set, otherwise the debounced typed value.
  const activeArea = pillArea || debouncedTypedArea;

  const { data, isLoading, isError } = useListings({
    area: activeArea,
    propertyType,
    minPrice,
    maxPrice,
    bedrooms,
  });

  const listings = data?.listings ?? [];

  function handleAreaPill(a: string) {
    if (pillArea === a) {
      // Deselect pill — fall back to typed input
      setPillArea("");
    } else {
      setPillArea(a);
      setAreaInput(a); // keep input in sync visually
    }
  }

  function clearAllFilters() {
    setAreaInput("");
    setPillArea("");
    setPropertyType("");
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setBedrooms(undefined);
  }

  const hasActiveFilters = Boolean(
    pillArea || debouncedTypedArea || propertyType || minPrice !== undefined || maxPrice !== undefined || bedrooms !== undefined
  );

  return (
    <section className="px-6 py-16 bg-muted/20">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header & Search Bar */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-secondary">
                <Sparkles className="h-3.5 w-3.5" /> Live Availability
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground mt-1">
                Browse Listings
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {isLoading
                  ? "Loading properties..."
                  : `${listings.length} ${listings.length === 1 ? "home" : "homes"} available across Nairobi`}
              </p>
            </div>
            <Link
              href="/browse"
              className="flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:border-secondary hover:text-secondary transition-colors shrink-0"
            >
              View all on map <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Live search bar — debounced, no button needed */}
          <div className="relative max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={areaInput}
              onChange={(e) => {
                setAreaInput(e.target.value);
                // Clear pill selection when user starts typing
                if (pillArea) setPillArea("");
              }}
              placeholder="Type to search — Kilimani, Karen, Westlands..."
              className="pl-9 pr-9 bg-card"
            />
            {areaInput && (
              <button
                type="button"
                onClick={() => { setAreaInput(""); setPillArea(""); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Area pills */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {AREAS.map((a) => {
              const active = pillArea === a;
              return (
                <button
                  type="button"
                  key={a}
                  onClick={() => handleAreaPill(a)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    active
                      ? "border-secondary bg-secondary/10 text-secondary"
                      : "border-border bg-card text-muted-foreground hover:border-secondary hover:text-secondary"
                  }`}
                >
                  {a}
                </button>
              );
            })}
            {(pillArea || areaInput) && (
              <button
                type="button"
                onClick={() => { setPillArea(""); setAreaInput(""); }}
                className="rounded-full border border-destructive/30 bg-destructive/5 px-3 py-1 text-xs text-destructive hover:bg-destructive/10 transition-colors"
              >
                Clear area filter
              </button>
            )}
          </div>
        </div>

        {/* Main Grid: Sidebar Filters + Cards */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="w-full lg:w-56 shrink-0">
            <div className="rounded-xl border border-border bg-card p-5 space-y-6 shadow-sm sticky top-6">
              <div className="flex items-center justify-between font-semibold border-b border-border pb-3">
                <div className="flex items-center gap-2 text-sm">
                  <SlidersHorizontal className="h-4 w-4 text-primary" />
                  Filters
                </div>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="text-xs text-destructive hover:underline font-medium cursor-pointer"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* Property Type */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Property Type
                </p>
                <div className="mt-2 space-y-1 max-h-48 overflow-y-auto pr-1">
                  {PROPERTY_TYPES.map((type) => {
                    const active = propertyType === type;
                    return (
                      <button
                        type="button"
                        key={type}
                        onClick={() =>
                          setPropertyType(active ? "" : type)
                        }
                        className={`block w-full rounded-md px-2.5 py-1.5 text-left text-xs transition-colors ${
                          active
                            ? "bg-secondary/15 text-secondary font-semibold"
                            : "text-foreground hover:bg-muted"
                        }`}
                      >
                        {type}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Price Range (KSh/mo)
                </p>
                <div className="mt-2 space-y-2">
                  <Input
                    type="number"
                    placeholder="Min price"
                    value={minPrice ?? ""}
                    onChange={(e) =>
                      setMinPrice(
                        e.target.value ? Number(e.target.value) : undefined
                      )
                    }
                    className="h-8 text-xs bg-background"
                  />
                  <Input
                    type="number"
                    placeholder="Max price"
                    value={maxPrice ?? ""}
                    onChange={(e) =>
                      setMaxPrice(
                        e.target.value ? Number(e.target.value) : undefined
                      )
                    }
                    className="h-8 text-xs bg-background"
                  />
                </div>
              </div>

              {/* Bedrooms */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Bedrooms
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {[0, 1, 2, 3, 4].map((n) => {
                    const active = bedrooms === n;
                    return (
                      <button
                        type="button"
                        key={n}
                        onClick={() =>
                          setBedrooms(active ? undefined : n)
                        }
                        className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                          active
                            ? "border-secondary bg-secondary/10 text-secondary"
                            : "border-border bg-background hover:border-secondary"
                        }`}
                      >
                        {n === 0 ? "Studio" : n === 4 ? "4+" : n}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </aside>

          {/* Listings Grid */}
          <div className="flex-1">
            {isLoading ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="h-80 animate-pulse rounded-xl bg-muted"
                  />
                ))}
              </div>
            ) : isError ? (
              <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-8 text-center text-sm text-destructive">
                Failed to load listings. Please make sure the backend is running.
              </div>
            ) : listings.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
                <Search className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="font-semibold text-foreground">No matching listings found</p>
                <p className="text-xs mt-1 text-muted-foreground">
                  Try adjusting your price range, property type, or location filters.
                </p>
                {hasActiveFilters && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={clearAllFilters}
                    className="mt-4 gap-1.5 text-xs"
                  >
                    <X className="h-3.5 w-3.5" /> Clear all filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {listings.map((listing: Listing) => {
                  const firstPhoto = listing.photos?.[0];
                  return (
                    <Link
                      key={listing.id}
                      href={`/listings/${listing.slug}`}
                      className="group block"
                    >
                      <div className="overflow-hidden rounded-xl border border-border bg-card transition-all hover:shadow-md hover:border-primary/30 flex flex-col h-full">
                        <div className="relative aspect-[4/3]">
                          {firstPhoto ? (
                            <Image
                              src={`${API_URL}${firstPhoto.url}`}
                              alt={listing.title}
                              fill
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                              className="object-cover transition-transform group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-muted">
                              <ImageOff className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                          {listing.landlord?.verification === "VERIFIED" && (
                            <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground">
                              <ShieldCheck className="h-3 w-3" />
                              Verified
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col flex-1 p-4">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-lg font-bold text-secondary">
                              KSh {listing.price.toLocaleString()}
                              <span className="text-sm font-normal text-muted-foreground">
                                /mo
                              </span>
                            </p>
                            <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                              {listing.propertyType}
                            </span>
                          </div>
                          <p className="mt-1 font-semibold line-clamp-1">
                            {listing.title}
                          </p>
                          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            <span className="line-clamp-1">
                              {listing.address}
                            </span>
                          </p>
                          <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <BedDouble className="h-3.5 w-3.5" />
                              {listing.bedrooms} bed
                            </span>
                            <span className="flex items-center gap-1">
                              <Bath className="h-3.5 w-3.5" />
                              {listing.bathrooms} bath
                            </span>
                          </div>

                          {/* CTA Button */}
                          <div className="mt-auto pt-4 border-t border-border">
                            <span className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all group-hover:bg-primary/90 group-hover:gap-3">
                              View Property{" "}
                              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
