"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Search,
  Trash2,
  ExternalLink,
  ImageOff,
  CheckCircle2,
  XCircle,
  Eye,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const STATUSES = ["", "PENDING", "ACTIVE", "EXPIRED", "REMOVED"];

export default function AdminListingsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("PENDING");
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-listings", search, status],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (status) params.set("status", status);
      return api.get(`/api/admin/listings?${params}`) as Promise<{
        listings: any[];
      }>;
    },
  });

  const { data: detailData } = useQuery({
    queryKey: ["admin-listing-detail", selectedListing?.id],
    queryFn: () =>
      api.get(`/api/admin/listings/${selectedListing.id}/detail`) as Promise<{
        listing: any;
      }>,
    enabled: !!selectedListing,
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) =>
      api.patch(`/api/admin/listings/${id}/approve`, { action }),
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-listings"] });
      toast.success(action === "approve" ? "Listing approved" : "Listing rejected");
      setSelectedListing(null);
    },
    onError: (err) => {
      toast.error("Failed", {
        description:
          err instanceof ApiError
            ? (err.body as any)?.error
            : "Something went wrong",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/listings/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-listings"] });
      toast.success("Listing deleted from database");
      setSelectedListing(null);
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/api/admin/listings/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-listings"] });
      toast.success("Status updated");
    },
  });

  const listings = data?.listings ?? [];
  const detail = detailData?.listing;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-background">Listings</h1>
        <p className="mt-1 text-background/50">{listings.length} listings found</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-background/30" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search listings..."
            className="pl-9 border-background/20 bg-background/10 text-background placeholder:text-background/30"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-md border border-background/20 bg-background/10 px-3 py-2 text-sm text-background"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s} className="text-foreground bg-background">
              {s || "All statuses"}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-6">
        {/* Listings list */}
        <div className="flex-1 space-y-3 min-w-0">
          {isLoading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-background/5" />
            ))
          ) : listings.length === 0 ? (
            <div className="rounded-xl border border-background/10 p-12 text-center text-background/40">
              No listings found
            </div>
          ) : (
            listings.map((listing) => {
              const photo = listing.photos?.[0];
              const isSelected = selectedListing?.id === listing.id;
              return (
                <div
                  key={listing.id}
                  className={`flex items-center gap-4 rounded-xl border p-4 cursor-pointer transition-colors ${
                    isSelected
                      ? "border-secondary bg-secondary/10"
                      : "border-background/10 bg-background/5 hover:bg-background/10"
                  }`}
                  onClick={() => setSelectedListing(listing)}
                >
                  <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-background/10">
                    {photo ? (
                      <Image
                        src={`${API_URL}${photo.url}`}
                        alt={listing.title}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <ImageOff className="h-4 w-4 text-background/30" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-background truncate">{listing.title}</p>
                    <p className="text-xs text-background/50 truncate">
                      {listing.landlord?.fullName} · Ksh{" "}
                      {listing.price?.toLocaleString()}/mo
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        listing.status === "ACTIVE"
                          ? "bg-primary/20 text-primary"
                          : listing.status === "PENDING"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : listing.status === "REMOVED"
                          ? "bg-destructive/20 text-destructive"
                          : "bg-background/10 text-background/50"
                      }`}
                    >
                      {listing.status}
                    </span>
                    <Eye className="h-4 w-4 text-background/30" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Detail panel */}
        {selectedListing && (
          <div className="w-80 shrink-0 rounded-xl border border-background/10 bg-background/5 p-5 space-y-4 h-fit sticky top-6">
            {detail ? (
              <>
                <div>
                  <h3 className="font-bold text-background">{detail.title}</h3>
                  <p className="text-xs text-background/50 mt-1">{detail.address}</p>
                </div>

                {detail.photos?.length > 0 && (
                  <div className="relative aspect-video rounded-lg overflow-hidden">
                    <Image
                      src={`${API_URL}${detail.photos[0].url}`}
                      alt={detail.title}
                      fill
                      sizes="320px"
                      className="object-cover"
                    />
                    {detail.photos.length > 1 && (
                      <span className="absolute bottom-2 right-2 rounded bg-foreground/70 px-1.5 py-0.5 text-xs text-background">
                        +{detail.photos.length - 1} photos
                      </span>
                    )}
                  </div>
                )}

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-background/50">Price</span>
                    <span className="text-background font-medium">
                      Ksh {detail.price?.toLocaleString()}/mo
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-background/50">Type</span>
                    <span className="text-background">{detail.propertyType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-background/50">Bedrooms</span>
                    <span className="text-background">{detail.bedrooms}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-background/50">Bathrooms</span>
                    <span className="text-background">{detail.bathrooms}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-background/50">Saves</span>
                    <span className="text-background">{detail._count?.savedBy}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-background/50">Inquiries</span>
                    <span className="text-background">{detail._count?.conversations}</span>
                  </div>
                </div>

                <div className="border-t border-background/10 pt-3">
                  <p className="text-xs font-semibold text-background/50 uppercase tracking-wide mb-2">
                    Landlord
                  </p>
                  <p className="text-sm font-medium text-background">{detail.landlord?.fullName}</p>
                  <p className="text-xs text-background/50">{detail.landlord?.email}</p>
                  <p className="text-xs text-background/50">{detail.landlord?.phone ?? "No phone"}</p>
                  <span
                    className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      detail.landlord?.verification === "VERIFIED"
                        ? "bg-primary/20 text-primary"
                        : "bg-background/10 text-background/50"
                    }`}
                  >
                    {detail.landlord?.verification}
                  </span>
                </div>

                <p className="text-xs text-background/50 leading-relaxed line-clamp-4">
                  {detail.description}
                </p>

                <div className="flex flex-col gap-2 pt-2">
                  {detail.status === "PENDING" && (
                    <>
                      <Button
                        onClick={() =>
                          approveMutation.mutate({ id: detail.id, action: "approve" })
                        }
                        disabled={approveMutation.isPending}
                        className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Approve listing
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() =>
                          approveMutation.mutate({ id: detail.id, action: "reject" })
                        }
                        disabled={approveMutation.isPending}
                        className="w-full gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject listing
                      </Button>
                    </>
                  )}

                  {detail.status === "ACTIVE" && (
                    <select
                      value={detail.status}
                      onChange={(e) =>
                        statusMutation.mutate({ id: detail.id, status: e.target.value })
                      }
                      className="w-full rounded-md border border-background/20 bg-background/10 px-3 py-2 text-sm text-background"
                    >
                      {["ACTIVE", "EXPIRED", "PENDING", "REMOVED"].map((s) => (
                        <option key={s} value={s} className="text-foreground bg-background">
                          {s}
                        </option>
                      ))}
                    </select>
                  )}

                  <Link href={`/listings/${detail.slug}`} target="_blank">
                    <Button
                      variant="outline"
                      className="w-full gap-2 border-background/20 text-background hover:bg-background/10"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View public page
                    </Button>
                  </Link>

                  <Button
                    variant="outline"
                    onClick={() => {
                      if (confirm("Permanently delete this listing from the database?")) {
                        deleteMutation.mutate(detail.id);
                      }
                    }}
                    disabled={deleteMutation.isPending}
                    className="w-full gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete from database
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-background" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
