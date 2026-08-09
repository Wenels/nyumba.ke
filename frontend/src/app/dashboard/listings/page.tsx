"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  PlusCircle,
  Pencil,
  Trash2,
  MapPin,
  Heart,
  ImageOff,
  CheckCircle2,
  Search,
  List,
  Map as MapIcon,
  Building2,
  Key,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { Property } from "@/app/features/listings/hooks/use-listings";
import { Button } from "@/components/ui/button";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface MyPropertiesResponse {
  listings: Property[];
  properties: Property[];
}

function ListingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [viewMode, setViewMode] = useState<"list" | "map">(
    (searchParams.get("view") as "list" | "map") || "list"
  );
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "any");
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "newest");

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    if (viewMode !== "list") params.set("view", viewMode);
    if (statusFilter !== "any") params.set("status", statusFilter);
    if (sortBy !== "newest") params.set("sort", sortBy);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [searchQuery, viewMode, statusFilter, sortBy, pathname, router]);

  const { data, isLoading, isError } = useQuery<MyPropertiesResponse>({
    queryKey: ["my-listings"],
    queryFn: () => api.get("/api/properties/my") as Promise<MyPropertiesResponse>,
  });

  const deleteMutation = useMutation({
    mutationFn: (slug: string) => api.delete(`/api/properties/${slug}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-listings"] });
      toast.success("Property deleted");
    },
    onError: (err) => {
      const message =
        err instanceof ApiError
          ? (err.body as { error?: string })?.error
          : "Failed to delete property";
      toast.error("Delete failed", { description: message });
    },
  });

  function handleDelete(slug: string, title: string) {
    if (!confirm(`Delete "${title}"? This will remove all associated unit categories and rooms.`)) return;
    deleteMutation.mutate(slug);
  }

  const properties: Property[] = data?.properties || data?.listings || [];

  const filteredProperties = useMemo(() => {
    return properties
      .filter((prop) => {
        const title = prop.name || prop.title;
        if (
          searchQuery &&
          !title.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !prop.address.toLowerCase().includes(searchQuery.toLowerCase())
        ) {
          return false;
        }
        if (statusFilter !== "any" && prop.status.toLowerCase() !== statusFilter.toLowerCase()) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "newest") return -1;
        if (sortBy === "oldest") return 1;
        if (sortBy === "price-high") return (b.minRent || b.price) - (a.minRent || a.price);
        if (sortBy === "price-low") return (a.minRent || a.price) - (b.minRent || b.price);
        return 0;
      });
  }, [properties, searchQuery, statusFilter, sortBy]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Properties</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your buildings, unit categories, and individual room vacancies.
          </p>
        </div>
        <Link href="/dashboard/post">
          <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2">
            <PlusCircle className="h-4 w-4" />
            Post New Property
          </Button>
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center bg-muted/50 rounded-lg p-1 shrink-0">
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                viewMode === "list"
                  ? "bg-background text-foreground shadow-sm font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <List className="h-4 w-4" />
              List View
            </button>
            <button
              onClick={() => setViewMode("map")}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                viewMode === "map"
                  ? "bg-background text-foreground shadow-sm font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <MapIcon className="h-4 w-4" />
              Map View
            </button>
          </div>
          
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by property name, estate, or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-4 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 rounded-md border border-border bg-background text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="any">Status: Any</option>
            <option value="active">Active</option>
            <option value="pending">Pending Review</option>
            <option value="removed">Filled / Off Market</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-9 px-3 rounded-md border border-border bg-background text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="newest">Sort: Newest First</option>
            <option value="oldest">Sort: Oldest First</option>
            <option value="price-high">Price: High to Low</option>
            <option value="price-low">Price: Low to High</option>
          </select>
        </div>

        <div className="text-xs text-muted-foreground">
          Showing {filteredProperties.length} of {properties.length} properties
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center text-destructive">
          Failed to load properties. Please make sure backend is running.
        </div>
      ) : properties.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-16 text-center">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <p className="mt-4 font-semibold text-lg">No properties listed yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add your building, define unit categories, and register vacant rooms to receive tenant bookings.
          </p>
          <Link href="/dashboard/post">
            <Button className="mt-5 bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2">
              <PlusCircle className="h-4 w-4" />
              Add Property
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProperties.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
              No properties found matching your criteria.
            </div>
          ) : (
            filteredProperties.map((prop: Property) => {
              const firstPhoto = prop.photos?.[0];
              const title = prop.name || prop.title;
              const unitTypesSummary = prop.unitTypes?.map((ut) => ut.label).join(", ") || prop.propertyType;
              const totalVacant = prop.vacantCount ?? prop.unitTypes?.reduce((acc, ut) => acc + (ut.units?.filter(u => u.status === "VACANT")?.length || 0), 0) ?? 0;

              return (
                <div
                  key={prop.id}
                  className="flex flex-col sm:flex-row gap-4 rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Thumbnail */}
                  <div className="relative h-32 w-full sm:w-44 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {firstPhoto ? (
                      <Image
                        src={`${API_URL}${firstPhoto.url}`}
                        alt={title}
                        fill
                        sizes="176px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <ImageOff className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    {totalVacant > 0 && (
                      <span className="absolute top-2 left-2 rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-bold text-primary-foreground shadow-sm">
                        {totalVacant} Vacant
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex flex-1 flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-lg text-foreground truncate">{title}</h3>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            prop.status === "ACTIVE"
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {prop.status}
                        </span>
                      </div>
                      <p className="mt-1 text-xl font-extrabold text-secondary">
                        KSh {(prop.minRent || prop.price || 0).toLocaleString()}
                        <span className="text-xs font-normal text-muted-foreground"> starting/mo</span>
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground truncate">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                        {prop.address}
                      </p>
                    </div>

                    <div className="mt-3 pt-3 border-t border-border flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1 font-medium text-foreground">
                          <Building2 className="h-3.5 w-3.5 text-secondary" />
                          {prop.propertyType}
                        </span>
                        <span className="flex items-center gap-1">
                          <Key className="h-3.5 w-3.5 text-primary" />
                          Categories: {unitTypesSummary}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="h-3.5 w-3.5" />
                          {prop._count?.savedBy ?? 0} saves
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link href={`/dashboard/listings/${prop.slug}`}>
                          <Button size="sm" className="text-xs">
                            View Details
                          </Button>
                        </Link>
                        <Link href={`/listings/${prop.slug}`}>
                          <Button variant="outline" size="sm" className="text-xs">
                            View Public
                          </Button>
                        </Link>
                        <Link href={`/dashboard/edit/${prop.slug}`}>
                          <Button variant="outline" size="sm" className="gap-1 text-xs">
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20"
                          onClick={() => handleDelete(prop.slug, title)}
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

export default function MyListingsPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    }>
      <ListingsContent />
    </Suspense>
  );
}
