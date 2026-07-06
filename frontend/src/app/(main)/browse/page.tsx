"use client";

import { useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useListings, Listing } from "@/app/features/listings/hooks/use-listings";
import { BrowseListingCard } from "@/app/features/listings/components/browse-listing-card";

const AREAS = ["Westlands", "Kilimani", "Karen", "Lavington", "Kasarani", "Roysambu"];
const PROPERTY_TYPES = [
  "Bedsitter",
  "1 Bedroom",
  "2 Bedrooms",
  "3 Bedrooms",
  "4+ Bedrooms",
  "Bungalow",
  "Maisonette",
  "Studio",
];

export default function BrowsePage() {
  const [area, setArea] = useState("");
  const [activeArea, setActiveArea] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [minPrice, setMinPrice] = useState<number | undefined>();
  const [maxPrice, setMaxPrice] = useState<number | undefined>();
  const [bedrooms, setBedrooms] = useState<number | undefined>();

  const { data, isLoading, isFetching, isError } = useListings({
    area: activeArea,
    propertyType,
    minPrice,
    maxPrice,
    bedrooms,
  });

  const listings = data?.listings ?? [];

  function handleSearch() {
    setActiveArea(area);
  }

  function handleAreaPill(a: string) {
    setActiveArea(a);
    setArea(a);
  }

  return (
    <main className="flex min-h-screen flex-col">
      {/* Search header */}
      <div className="border-b border-border bg-background px-6 py-6">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-2xl font-bold tracking-tight">Browse listings</h1>
          <p className="mt-1 text-muted-foreground">
            {isLoading ? "Loading..." : `${listings.length} homes available across Nairobi`}
          </p>

          {/* Search bar */}
          <div className="mt-4 flex gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={area}
                onChange={(e) => setArea(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search by area — Kilimani, Karen..."
                className="pl-9"
              />
            </div>
            <Button
              onClick={handleSearch}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
            >
              Search
            </Button>
          </div>

          {/* Area pills */}
          <div className="mt-3 flex flex-wrap gap-2">
            {AREAS.map((a) => (
              <button
                key={a}
                onClick={() => handleAreaPill(a)}
                className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                  activeArea === a
                    ? "border-secondary bg-secondary/10 text-secondary"
                    : "border-border hover:border-secondary hover:text-secondary"
                }`}
              >
                {a}
              </button>
            ))}
            {activeArea && (
              <button
                onClick={() => { setActiveArea(""); setArea(""); }}
                className="rounded-full border border-destructive/50 px-3 py-1 text-sm text-destructive hover:bg-destructive/10"
              >
                Clear filter
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-6 py-8">
        <div className="flex gap-8">
          {/* Filters sidebar */}
          <aside className="hidden w-56 shrink-0 lg:block">
            <div className="sticky top-6 space-y-6">
              <div className="flex items-center justify-between font-semibold">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                </div>
                {(propertyType || minPrice !== undefined || maxPrice !== undefined || bedrooms !== undefined) && (
                  <button
                    onClick={() => {
                      setPropertyType("");
                      setMinPrice(undefined);
                      setMaxPrice(undefined);
                      setBedrooms(undefined);
                    }}
                    className="text-xs text-destructive hover:underline cursor-pointer"
                  >
                    Clear all
                  </button>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Property type
                </label>
                <div className="mt-2 space-y-1">
                  {PROPERTY_TYPES.map((type) => (
                    <button
                      key={type}
                      onClick={() => setPropertyType(propertyType === type ? "" : type)}
                      className={`block w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                        propertyType === type
                          ? "bg-secondary/10 text-secondary font-medium"
                          : "hover:bg-muted"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Price range (Ksh/mo)
                </label>
                <div className="mt-2 space-y-2">
                  <Input
                    type="number"
                    placeholder="Min price"
                    value={minPrice ?? ""}
                    onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : undefined)}
                  />
                  <Input
                    type="number"
                    placeholder="Max price"
                    value={maxPrice ?? ""}
                    onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Bedrooms
                </label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[0, 1, 2, 3, 4].map((n) => (
                    <button
                      key={n}
                      onClick={() => setBedrooms(bedrooms === n ? undefined : n)}
                      className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                        bedrooms === n
                          ? "border-secondary bg-secondary/10 text-secondary"
                          : "border-border hover:border-secondary"
                      }`}
                    >
                      {n === 0 ? "Studio" : n === 4 ? "4+" : n}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Listings grid */}
          <div className="flex-1">
            {isLoading || isFetching ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-72 animate-pulse rounded-xl bg-muted" />
                ))}
              </div>
            ) : isError ? (
              <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-6 text-center text-destructive">
                Failed to load listings. Is the backend running?
              </div>
            ) : listings.length === 0 ? (
              <div className="rounded-xl border border-border p-12 text-center text-muted-foreground">
                No listings found. Try a different area or filter.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {listings.map((listing: Listing) => (
                  <BrowseListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
