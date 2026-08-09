"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { BrowseListingCard } from "@/app/features/listings/components/browse-listing-card";
import {
  type Listing,
  useListings,
} from "@/app/features/listings/hooks/use-listings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";

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
];

function BrowseContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Initialize all filter state from URL params
  const [area, setArea] = useState(searchParams.get("area") || "");
  const [propertyType, setPropertyType] = useState(searchParams.get("type") || "");
  const [minPrice, setMinPrice] = useState<number | undefined>(
    searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined
  );
  const [maxPrice, setMaxPrice] = useState<number | undefined>(
    searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined
  );
  const [bedrooms, setBedrooms] = useState<number | undefined>(
    searchParams.get("bedrooms") !== null && searchParams.get("bedrooms") !== ""
      ? Number(searchParams.get("bedrooms"))
      : undefined
  );

  // Debounce the typed area input — fires query 400ms after user stops typing
  const debouncedArea = useDebounce(area, 400);

  const { data, isLoading, isFetching, isError } = useListings({
    area: debouncedArea,
    propertyType,
    minPrice,
    maxPrice,
    bedrooms,
  });

  const listings = data?.listings ?? [];

  // Sync all filter state to URL whenever it changes (persists on refresh)
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedArea) params.set("area", debouncedArea);
    if (propertyType) params.set("type", propertyType);
    if (minPrice !== undefined) params.set("minPrice", minPrice.toString());
    if (maxPrice !== undefined) params.set("maxPrice", maxPrice.toString());
    if (bedrooms !== undefined) params.set("bedrooms", bedrooms.toString());
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [debouncedArea, propertyType, minPrice, maxPrice, bedrooms, pathname, router]);

  function handleAreaPill(a: string) {
    setArea(area === a ? "" : a);
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Search header */}
      <div className="border-b border-border bg-background px-6 py-6">
        <h1 className="text-2xl font-bold tracking-tight">Browse Listings</h1>
        <p className="mt-1 text-muted-foreground">
          {isLoading
            ? "Loading..."
            : `${listings.length} homes available across Nairobi`}
        </p>

        {/* Search bar — live, no button press needed */}
        <div className="mt-4 relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder="Type to search — Kilimani, Karen..."
            className="pl-9 pr-9"
          />
          {area && (
            <button
              type="button"
              onClick={() => setArea("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Area pills */}
        <div className="mt-3 flex flex-wrap gap-2">
          {AREAS.map((a) => (
            <button
              type="button"
              key={a}
              onClick={() => handleAreaPill(a)}
              className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                debouncedArea === a
                  ? "border-secondary bg-secondary/10 text-secondary"
                  : "border-border hover:border-secondary hover:text-secondary"
              }`}
            >
              {a}
            </button>
          ))}
          {area && (
            <button
              type="button"
              onClick={() => setArea("")}
              className="rounded-full border border-destructive/50 px-3 py-1 text-sm text-destructive hover:bg-destructive/10"
            >
              Clear filter
            </button>
          )}
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
                {(propertyType ||
                  minPrice !== undefined ||
                  maxPrice !== undefined ||
                  bedrooms !== undefined) && (
                  <button
                    type="button"
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
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Property type
                </p>
                <div className="mt-2 space-y-1">
                  {PROPERTY_TYPES.map((type) => (
                    <button
                      type="button"
                      key={type}
                      onClick={() =>
                        setPropertyType(propertyType === type ? "" : type)
                      }
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
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Price range (Ksh/mo)
                </p>
                <div className="mt-2 space-y-2">
                  <Input
                    type="number"
                    placeholder="Min price"
                    value={minPrice ?? ""}
                    onChange={(e) =>
                      setMinPrice(
                        e.target.value ? Number(e.target.value) : undefined,
                      )
                    }
                  />
                  <Input
                    type="number"
                    placeholder="Max price"
                    value={maxPrice ?? ""}
                    onChange={(e) =>
                      setMaxPrice(
                        e.target.value ? Number(e.target.value) : undefined,
                      )
                    }
                  />
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Bedrooms
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[0, 1, 2, 3, 4].map((n) => (
                    <button
                      type="button"
                      key={n}
                      onClick={() =>
                        setBedrooms(bedrooms === n ? undefined : n)
                      }
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
                  <div
                    // biome-ignore lint/suspicious/noArrayIndexKey: skeleton loader
                    key={i}
                    className="h-72 animate-pulse rounded-xl bg-muted"
                  />
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
    </div>
  );
}

export default function TenantBrowsePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      }
    >
      <BrowseContent />
    </Suspense>
  );
}
