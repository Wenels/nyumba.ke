import Link from "next/link";
import Image from "next/image";
import { MapPin, BedDouble, Bath, ShieldCheck } from "lucide-react";
import type { Listing } from "@/app/features/listings/hooks/use-listings";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export function BrowseListingCard({ listing }: { listing: Listing }) {
  const firstPhoto = listing.photos[0];
  const imageUrl = firstPhoto
    ? `${API_URL}${firstPhoto.url}`
    : "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80";

  return (
    <Link href={`/listings/${listing.slug}`} className="group block">
      <div className="overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-md">
        <div className="relative aspect-[4/3]">
          <Image
            src={imageUrl}
            alt={listing.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform group-hover:scale-105"
          />
          {listing.landlord.verification === "VERIFIED" && (
            <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground">
              <ShieldCheck className="h-3 w-3" />
              Verified
            </span>
          )}
          {listing.photos.length > 1 && (
            <span className="absolute bottom-3 right-3 rounded-md bg-foreground/70 px-2 py-1 text-xs text-background">
              +{listing.photos.length - 1} photos
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
}
