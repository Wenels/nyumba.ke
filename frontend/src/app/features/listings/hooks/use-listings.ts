import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface Photo {
  id: string;
  url: string;
  order: number;
}

export interface Landlord {
  id: string;
  fullName: string;
  phone?: string | null;
  verification: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
  avatarUrl?: string | null;
}

export interface Listing {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  propertyType: string;
  address: string;
  latitude: number;
  longitude: number;
  status: string;
  expiresAt: string;
  createdAt: string;
  photos: Photo[];
  landlord: Landlord;
  _count: { savedBy: number };
}


interface ListingsFilters {
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  propertyType?: string;
  area?: string;
}

interface ListingsResponse {
  listings: Listing[];
}

export function useListings(filters: ListingsFilters = {}) {
  const params = new URLSearchParams();
  if (filters.minPrice !== undefined && filters.minPrice !== null) params.set("minPrice", String(filters.minPrice));
  if (filters.maxPrice !== undefined && filters.maxPrice !== null) params.set("maxPrice", String(filters.maxPrice));
  if (filters.bedrooms !== undefined && filters.bedrooms !== null) params.set("bedrooms", String(filters.bedrooms));
  if (filters.propertyType) params.set("propertyType", filters.propertyType);
  if (filters.area) params.set("area", filters.area);

  const queryString = params.toString();

  return useQuery<ListingsResponse>({
    queryKey: ["listings", queryString],
    queryFn: () => api.get(`/api/listings${queryString ? `?${queryString}` : ""}`) as Promise<ListingsResponse>,
    // staleTime: 0 — always re-fetch when filters change so stale cached data
    // is never served as if it were current (the root cause of the flicker bug).
    staleTime: 0,
  });
}

export function useListing(id: string) {
  return useQuery({
    queryKey: ["listings", id],
    queryFn: () => api.get(`/api/listings/${id}`),
    enabled: !!id,
  });
}
