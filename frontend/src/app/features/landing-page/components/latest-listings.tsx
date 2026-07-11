"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, MapPin, BedDouble, Bath, ShieldCheck, ImageOff } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Listing } from "@/app/features/listings/hooks/use-listings";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export function LatestListings() {
  const { data, isLoading } = useQuery({
    queryKey: ["latest-listings"],
    queryFn: () =>
      api.get("/api/listings?status=ACTIVE") as Promise<{ listings: Listing[] }>,
  });

  const listings = (data?.listings ?? []).slice(0, 3);

  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Latest listings</h2>
            <p className="mt-1 text-muted-foreground">Fresh vacancies across Nairobi</p>
          </div>
          <Link
            href="/browse"
            className="flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium hover:border-secondary hover:text-secondary transition-colors"
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="mt-10 rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
            No listings yet — be the first to post one.
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => {
              const firstPhoto = listing.photos?.[0];
              return (
                <Link key={listing.id} href={`/listings/${listing.slug}`} className="group block">
                  <div className="overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-md">
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
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-lg font-bold text-secondary">
                          Ksh {listing.price.toLocaleString()}
                          <span className="text-sm font-normal text-muted-foreground">/mo</span>
                        </p>
                        <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                          {listing.propertyType}
                        </span>
                      </div>
                      <p className="mt-1 font-semibold line-clamp-1">{listing.title}</p>
                      <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="line-clamp-1">{listing.address}</span>
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
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
