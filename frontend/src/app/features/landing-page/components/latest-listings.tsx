import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { ListingCard, type ListingCardProps } from "./listing-card";

// Placeholder data until this is wired to the real /api/listings endpoint
const SAMPLE_LISTINGS: ListingCardProps[] = [
  {
    imageUrl:
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
    price: 2500,
    bedrooms: 2,
    bathrooms: 2,
    area: "Kilimani",
    address: "Menelik Road, Kilimani division, Westlands",
    verified: true,
    pinned: true,
    photoCount: 1,
  },
];

export function LatestListings() {
  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Latest listings
            </h2>
            <p className="mt-1 text-muted-foreground">
              Fresh vacancies across Nairobi
            </p>
          </div>
          <Link
            href="/browse"
            className="flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium hover:border-secondary hover:text-secondary transition-colors"
          >
            View all
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SAMPLE_LISTINGS.map((listing, i) => (
            <ListingCard key={i} {...listing} />
          ))}
        </div>
      </div>
    </section>
  );
}
