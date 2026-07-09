"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, Trash2, ExternalLink, ImageOff } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const STATUSES = ["", "ACTIVE", "EXPIRED", "PENDING", "REMOVED"];

export default function AdminListingsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-listings", search, status],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (status) params.set("status", status);
      return api.get(`/api/admin/listings?${params}`) as Promise<{ listings: any[] }>;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/listings/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-listings"] });
      toast.success("Listing deleted");
    },
    onError: (err) => {
      toast.error("Failed", { description: (err instanceof ApiError ? (err.body as any)?.error : "Error") });
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-background">Listings</h1>
        <p className="mt-1 text-background/50">{listings.length} listings found</p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
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

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-background/5" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((listing) => {
            const photo = listing.photos?.[0];
            return (
              <div
                key={listing.id}
                className="flex items-center gap-4 rounded-xl border border-background/10 bg-background/5 p-4"
              >
                <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-background/10">
                  {photo ? (
                    <Image src={`${API_URL}${photo.url}`} alt={listing.title} fill sizes="80px" className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ImageOff className="h-4 w-4 text-background/30" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-background truncate">{listing.title}</p>
                  <p className="text-xs text-background/50 truncate">
                    {listing.landlord.fullName} · Ksh {listing.price?.toLocaleString()}/mo · {listing.address}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={listing.status}
                    onChange={(e) => statusMutation.mutate({ id: listing.id, status: e.target.value })}
                    className="rounded-md border border-background/20 bg-background/10 px-2 py-1 text-xs text-background"
                  >
                    {["ACTIVE", "EXPIRED", "PENDING", "REMOVED"].map((s) => (
                      <option key={s} value={s} className="text-foreground bg-background">{s}</option>
                    ))}
                  </select>
                  <Link href={`/listings/${listing.slug}`} target="_blank">
                    <Button variant="outline" size="sm" className="border-background/20 text-background hover:bg-background/10">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-destructive/30 text-destructive hover:bg-destructive/10"
                    onClick={() => confirm("Delete this listing?") && deleteMutation.mutate(listing.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
