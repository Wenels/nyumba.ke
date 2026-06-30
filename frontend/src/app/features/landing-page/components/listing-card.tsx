import Image from "next/image";
import { MapPin, BedDouble, Bath, ShieldCheck, MapPinned } from "lucide-react";

export interface ListingCardProps {
  imageUrl: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  area: string;
  address: string;
  verified?: boolean;
  pinned?: boolean;
  photoCount?: number;
}

export function ListingCard({
  imageUrl,
  price,
  bedrooms,
  bathrooms,
  area,
  address,
  verified,
  pinned,
  photoCount = 1,
}: ListingCardProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="relative aspect-[4/3]">
        <Image src={imageUrl} alt={address} fill className="object-cover" />
        {pinned && (
          <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground">
            <MapPinned className="h-3 w-3" />
            Pinned
          </span>
        )}
        <span className="absolute bottom-3 right-3 rounded-md bg-foreground/70 px-2 py-1 text-xs text-background">
          +{photoCount} photos
        </span>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-lg font-bold text-secondary">
            Ksh {price.toLocaleString()}
            <span className="text-sm font-normal text-muted-foreground">/mo</span>
          </p>
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
            {area}
          </span>
        </div>

        <p className="mt-2 font-semibold">{bedrooms} Bedrooms</p>
        <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          {address}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Bath className="h-3.5 w-3.5" />
            {bathrooms} bath
          </span>
          {verified && (
            <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              <ShieldCheck className="h-3 w-3" />
              Verified
            </span>
          )}
          {pinned && (
            <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              <MapPinned className="h-3 w-3" />
              Pinned
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
