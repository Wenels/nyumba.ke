"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  PlusCircle,
  Pencil,
  Trash2,
  MapPin,
  BedDouble,
  Bath,
  Heart,
  MessageSquare,
  ImageOff,
  CheckCircle2,
  Search,
  List,
  Map as MapIcon,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { Listing } from "@/app/features/listings/hooks/use-listings";
import { Button } from "@/components/ui/button";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface MyListingsResponse {
  listings: Listing[];
}

export default function MyListingsPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [locationFilter, setLocationFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("any");
  const [sortBy, setSortBy] = useState("newest");

  const { data, isLoading, isError } = useQuery<MyListingsResponse>({
    queryKey: ["my-listings"],
    queryFn: () => api.get("/api/listings/my") as Promise<MyListingsResponse>,
  });

  const deleteMutation = useMutation({
    mutationFn: (slug: string) => api.delete(`/api/listings/${slug}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-listings"] });
      toast.success("Listing deleted");
    },
    onError: (err) => {
      const message =
        err instanceof ApiError
          ? (err.body as { error?: string })?.error
          : "Failed to delete listing";
      toast.error("Delete failed", { description: message });
    },
  });

  function handleDelete(slug: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    deleteMutation.mutate(slug);
  }

  const listings: Listing[] = data?.listings ?? [];

  const filteredListings = useMemo(() => {
    return listings
      .filter((listing) => {
        // Search
        if (
          searchQuery &&
          !listing.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !listing.address.toLowerCase().includes(searchQuery.toLowerCase())
        ) {
          return false;
        }
        // Location
        // (Mock location filter logic based on title/address for now)
        if (locationFilter !== "all") {
           // Skip for now, real implementation would match ward/county
        }
        // Status
        if (statusFilter !== "any" && listing.status.toLowerCase() !== statusFilter.toLowerCase()) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        // Sort logic (mocked since we don't have createdAt, assuming latest ID or fallback)
        if (sortBy === "newest") return -1;
        if (sortBy === "oldest") return 1;
        if (sortBy === "price-high") return b.price - a.price;
        if (sortBy === "price-low") return a.price - b.price;
        return 0;
      });
  }, [listings, searchQuery, locationFilter, statusFilter, sortBy]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My properties</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your listed properties and vacancies.
          </p>
        </div>
        <Link href="/dashboard/post">
          <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2">
            <PlusCircle className="h-4 w-4" />
            Post new property
          </Button>
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        {/* Top Row: View Toggle & Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center bg-muted/50 rounded-lg p-1 shrink-0">
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                viewMode === "list"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <List className="h-4 w-4" />
              List
            </button>
            <button
              onClick={() => setViewMode("map")}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                viewMode === "map"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <MapIcon className="h-4 w-4" />
              Map
            </button>
          </div>
          
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by property name or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-4 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>

        {/* Middle Row: Filters */}
        <div className="flex flex-wrap gap-3">
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="h-9 px-3 rounded-md border border-border bg-background text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">Location: All</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 rounded-md border border-border bg-background text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="any">Status: Any</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="filled">Filled</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-9 px-3 rounded-md border border-border bg-background text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="newest">Sort: Newest</option>
            <option value="oldest">Sort: Oldest</option>
            <option value="price-high">Price: High to Low</option>
            <option value="price-low">Price: Low to High</option>
          </select>
        </div>

        {/* Bottom Row: Results count */}
        <div className="text-sm text-muted-foreground">
          Showing {filteredListings.length} of {listings.length} properties
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center text-destructive">
          Failed to load listings. Is the backend running?
        </div>
      ) : listings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-16 text-center">
          <PlusCircle className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-4 font-semibold">No listings yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Post your first listing to start receiving inquiries.
          </p>
          <Link href="/dashboard/post">
            <Button className="mt-5 bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2">
              <PlusCircle className="h-4 w-4" />
              Post listing
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredListings.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
              No properties found matching your criteria.
            </div>
          ) : (
            filteredListings.map((listing: Listing) => {
              const firstPhoto = listing.photos?.[0];
              return (
                <div
                  key={listing.id}
                  className="flex gap-4 rounded-xl border border-border bg-card p-4"
                >
                  {/* Thumbnail */}
                  <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {firstPhoto ? (
                      <Image
                        src={`${API_URL}${firstPhoto.url}`}
                        alt={listing.title}
                        fill
                        sizes="128px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <ImageOff className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex flex-1 flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold truncate">{listing.title}</h3>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            listing.status === "ACTIVE"
                              ? "bg-primary/10 text-primary"
                              : listing.status === "EXPIRED"
                              ? "bg-destructive/10 text-destructive"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {listing.status}
                        </span>
                      </div>
                      <p className="mt-1 text-lg font-bold text-secondary">
                        Ksh {listing.price.toLocaleString()}
                        <span className="text-sm font-normal text-muted-foreground">/mo</span>
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground truncate">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        {listing.address}
                      </p>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <BedDouble className="h-3.5 w-3.5" />
                          {listing.bedrooms} bed
                        </span>
                        <span className="flex items-center gap-1">
                          <Bath className="h-3.5 w-3.5" />
                          {listing.bathrooms} bath
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="h-3.5 w-3.5" />
                          {listing._count?.savedBy ?? 0} saves
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link href={`/listings/${listing.slug}`}>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </Link>
                        <Link href={`/dashboard/edit/${listing.slug}`}>
                          <Button variant="outline" size="sm" className="gap-1.5">
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 text-muted-foreground hover:bg-muted"
                          onClick={() => {
                            if (confirm("Mark this listing as filled? It will be hidden from browse.")) {
                              fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/listings/${listing.slug}`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                credentials: "include",
                                body: JSON.stringify({ status: "REMOVED" }),
                              }).then(() => {
                                queryClient.invalidateQueries({ queryKey: ["my-listings"] });
                                toast.success("Listing marked as filled and hidden");
                              });
                            }
                          }}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Mark filled
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20"
                          onClick={() => handleDelete(listing.slug, listing.title)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
