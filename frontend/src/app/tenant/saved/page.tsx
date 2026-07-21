"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bath,
  BedDouble,
  Heart,
  HeartOff,
  ImageOff,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { useAuth } from "@/app/features/auth/hooks/use-auth";
import type { Listing } from "@/app/features/listings/hooks/use-listings";
import { Button } from "@/components/ui/button";
import { ApiError, api } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface SavedResponse {
  saved: Listing[];
}

export default function SavedPage() {
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery<SavedResponse>({
    queryKey: ["saved"],
    queryFn: () => api.get("/api/saved") as Promise<SavedResponse>,
    enabled: !!user,
  });

  const unsaveMutation = useMutation({
    mutationFn: (listingId: string) => api.delete(`/api/saved/${listingId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved"] });
      toast.success("Removed from saved");
    },
    onError: (err) => {
      const message =
        err instanceof ApiError
          ? (err.body as { error?: string })?.error
          : "Failed to remove";
      toast.error("Error", { description: message });
    },
  });

  const listings = data?.saved ?? [];

  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <Heart className="mx-auto h-12 w-12 text-muted-foreground" />
        <h1 className="mt-4 text-xl font-bold">
          Sign in to view saved listings
        </h1>
        <p className="mt-2 text-muted-foreground">
          Save listings you like and come back to them later.
        </p>
        <Link href="/login">
          <Button className="mt-6 bg-secondary text-secondary-foreground hover:bg-secondary/90">
            Sign in
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Saved listings</h1>
        <p className="mt-1 text-muted-foreground">
          {isLoading
            ? "Loading..."
            : `${listings.length} saved listing${listings.length !== 1 ? "s" : ""}`}
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center text-destructive">
          Failed to load saved listings.
        </div>
      ) : listings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-16 text-center">
          <HeartOff className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-4 font-semibold">No saved listings yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse listings and save the ones you like.
          </p>
          <Link href="/browse">
            <Button className="mt-5 bg-secondary text-secondary-foreground hover:bg-secondary/90">
              Browse listings
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing: Listing) => {
            const firstPhoto = listing.photos?.[0];
            return (
              <div
                key={listing.id}
                className="overflow-hidden rounded-xl border border-border bg-card"
              >
                <Link href={`/listings/${listing.slug}`}>
                  <div className="relative aspect-[4/3]">
                    {firstPhoto ? (
                      <Image
                        src={`${API_URL}${firstPhoto.url}`}
                        alt={listing.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted">
                        <ImageOff className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    {listing.landlord.verification === "VERIFIED" && (
                      <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground">
                        <ShieldCheck className="h-3 w-3" />
                        Verified
                      </span>
                    )}
                  </div>
                </Link>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-lg font-bold text-secondary">
                      Ksh {listing.price.toLocaleString()}
                      <span className="text-sm font-normal text-muted-foreground">
                        /mo
                      </span>
                    </p>
                    <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                      {listing.propertyType}
                    </span>
                  </div>

                  <Link href={`/listings/${listing.slug}`}>
                    <p className="mt-1 font-semibold line-clamp-1 hover:text-secondary">
                      {listing.title}
                    </p>
                  </Link>

                  <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="line-clamp-1">{listing.address}</span>
                  </p>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <BedDouble className="h-3.5 w-3.5" />
                        {listing.bedrooms} bed
                      </span>
                      <span className="flex items-center gap-1">
                        <Bath className="h-3.5 w-3.5" />
                        {listing.bathrooms} bath
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => unsaveMutation.mutate(listing.id)}
                      disabled={unsaveMutation.isPending}
                      className="flex items-center gap-1 rounded-full border border-destructive/20 px-2.5 py-1 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <HeartOff className="h-3 w-3" />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
