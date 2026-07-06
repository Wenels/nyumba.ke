"use client";

import Image from "next/image";
import Link from "next/link";
import { use } from "react";
import {
  ArrowLeft,
  Bath,
  BedDouble,
  Building2,
  Calendar,
  MapPin,
  Phone,
  ShieldCheck,
  ShieldX,
  UserCircle2,
} from "lucide-react";
import { useListing } from "@/app/features/listings/hooks/use-listings";
import type { Listing } from "@/app/features/listings/hooks/use-listings";
import { MapView } from "@/app/features/listings/components/map-view";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-KE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function PhotoGallery({ listing }: { listing: Listing }) {
  const photos = listing.photos;

  if (photos.length === 0) {
    return (
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-muted flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <MapPin className="h-12 w-12" />
          <span className="text-sm">No photos yet</span>
        </div>
      </div>
    );
  }

  const main = photos[0];
  const rest = photos.slice(1, 5);

  return (
    <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[420px] rounded-2xl overflow-hidden">
      <div className={`relative ${rest.length > 0 ? "col-span-2 row-span-2" : "col-span-4 row-span-2"}`}>
        <Image
          src={`${API_URL}${main.url}`}
          alt={listing.title}
          fill
          className="object-cover"
          priority
        />
      </div>
      {rest.map((photo, i) => (
        <div key={photo.id} className="relative col-span-1 row-span-1 overflow-hidden">
          <Image
            src={`${API_URL}${photo.url}`}
            alt={`${listing.title} photo ${i + 2}`}
            fill
            className="object-cover"
          />
          {i === 3 && listing.photos.length > 5 && (
            <div className="absolute inset-0 flex items-center justify-center bg-foreground/50 text-background text-lg font-semibold">
              +{listing.photos.length - 5}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function LandlordCard({ listing }: { listing: Listing }) {
  const { landlord } = listing;
  const isVerified = landlord.verification === "VERIFIED";

  return (
    <div className="sticky top-6 rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted">
          {landlord.avatarUrl ? (
            <Image
              src={landlord.avatarUrl}
              alt={landlord.fullName}
              width={48}
              height={48}
              className="rounded-full object-cover"
            />
          ) : (
            <UserCircle2 className="h-8 w-8 text-muted-foreground" />
          )}
        </div>
        <div>
          <p className="font-semibold">{landlord.fullName}</p>
          <div className="flex items-center gap-1 mt-0.5">
            {isVerified ? (
              <>
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs text-primary font-medium">Verified landlord</span>
              </>
            ) : (
              <>
                <ShieldX className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Unverified</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-border" />

      <div>
        <p className="text-3xl font-bold text-secondary">
          Ksh {listing.price.toLocaleString()}
        </p>
        <p className="text-sm text-muted-foreground mt-0.5">per month</p>
      </div>

      {landlord.phone ? (
        <a
          href={`tel:${landlord.phone}`}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-3 text-sm font-semibold text-secondary-foreground hover:bg-secondary/90 transition-colors"
        >
          <Phone className="h-4 w-4" />
          Call {landlord.phone}
        </a>
      ) : (
        <a
          href={`https://wa.me/?text=${encodeURIComponent(`Hi, I saw your listing "${listing.title}" on Nyumba.ke and I'm interested.`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-3 text-sm font-semibold text-secondary-foreground hover:bg-secondary/90 transition-colors"
        >
          <Phone className="h-4 w-4" />
          Contact via WhatsApp
        </a>
      )}

      <p className="text-center text-xs text-muted-foreground">
        No agent fees — contact directly
      </p>

      <div className="flex items-center gap-2 text-xs text-muted-foreground border-t border-border pt-4">
        <Calendar className="h-3.5 w-3.5 shrink-0" />
        <span>Listed {formatDate(listing.createdAt)}</span>
      </div>
    </div>
  );
}

function SkeletonDetail() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-[420px] w-full rounded-2xl bg-muted" />
      <div className="grid grid-cols-3 gap-4">
        <div className="h-6 col-span-2 rounded bg-muted" />
        <div className="h-6 rounded bg-muted" />
      </div>
      <div className="h-4 w-1/3 rounded bg-muted" />
      <div className="space-y-2">
        <div className="h-4 rounded bg-muted" />
        <div className="h-4 rounded bg-muted" />
        <div className="h-4 w-3/4 rounded bg-muted" />
      </div>
    </div>
  );
}

export default function ListingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { data, isLoading, isError } = useListing(slug);
  const listing = (data as { listing: Listing } | undefined)?.listing;

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/browse"
          className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Browse
        </Link>
        {listing && (
          <>
            <span>/</span>
            <span className="font-medium text-foreground line-clamp-1 max-w-[300px]">
              {listing.title}
            </span>
          </>
        )}
      </div>

      {isLoading ? (
        <SkeletonDetail />
      ) : isError || !listing ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-12 text-center">
          <p className="text-lg font-semibold text-destructive">Listing not found</p>
          <p className="mt-2 text-sm text-muted-foreground">
            This listing may have been removed or the link is incorrect.
          </p>
          <Link
            href="/browse"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-secondary px-5 py-2.5 text-sm font-semibold text-secondary-foreground hover:bg-secondary/90"
          >
            Browse all listings
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left: main content */}
          <div className="lg:col-span-2 space-y-8">
            <PhotoGallery listing={listing} />

            <div>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h1 className="text-2xl font-bold tracking-tight">{listing.title}</h1>
                <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                  {listing.propertyType}
                </span>
              </div>
              <p className="mt-2 flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" />
                {listing.address}
              </p>
            </div>

            {/* Specs */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { icon: BedDouble, label: "Bedrooms", value: listing.bedrooms },
                { icon: Bath, label: "Bathrooms", value: listing.bathrooms },
                { icon: Building2, label: "Type", value: listing.propertyType },
                {
                  icon: ShieldCheck,
                  label: "Landlord",
                  value: listing.landlord.verification === "VERIFIED" ? "Verified" : "Unverified",
                },
              ].map(({ icon: Icon, label, value }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card p-4 text-center"
                >
                  <Icon className="h-5 w-5 text-secondary" />
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <span className="font-semibold text-sm">{value}</span>
                </div>
              ))}
            </div>

            {/* Description */}
            <div>
              <h2 className="text-lg font-semibold">About this property</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground whitespace-pre-line">
                {listing.description}
              </p>
            </div>

            {/* Map */}
            <div>
              <h2 className="text-lg font-semibold">Location</h2>
              <div className="mt-3">
                <MapView lat={listing.latitude} lng={listing.longitude} />
              </div>
            </div>
          </div>

          {/* Right: landlord sticky card */}
          <div className="lg:col-span-1">
            <LandlordCard listing={listing} />
          </div>
        </div>
      )}
    </div>
  );
}
