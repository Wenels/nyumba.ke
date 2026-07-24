import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface Photo {
  id: string;
  url: string;
  order: number;
}

export interface Amenity {
  id: string;
  name: string;
  available: boolean;
}

export interface ConditionReport {
  id: string;
  floors: Record<string, unknown>;
  utilities: Record<string, unknown>;
  walls: Record<string, unknown>;
  allPassed: boolean;
}

export interface Landlord {
  id: string;
  fullName: string;
  phone?: string | null;
  verification: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
  avatarUrl?: string | null;
}

export interface Unit {
  id: string;
  unitTypeId: string;
  unitNumber: string;
  floor: number;
  doorNumber?: string | null;
  status: "VACANT" | "OCCUPIED" | "MAINTENANCE" | "RESERVED";
  rentOverride?: number | null;
  description?: string | null;
  photos?: Photo[];
  amenities?: Amenity[];
  conditionReport?: ConditionReport | null;
}

export interface UnitType {
  id: string;
  propertyId: string;
  label: string;
  bedroomCount: number;
  bathrooms: number;
  monthlyRent: number;
  securityDeposit: number;
  description?: string | null;
  photos?: Photo[];
  amenities?: Amenity[];
  conditionReport?: ConditionReport | null;
  units?: Unit[];
}

export interface Property {
  id: string;
  slug: string;
  name: string;
  title: string; // alias
  description: string;
  propertyType: string;
  address: string;
  county?: string | null;
  town?: string | null;
  estate?: string | null;
  ward?: string | null;
  street?: string | null;
  postalCode?: string | null;
  latitude: number;
  longitude: number;
  status: string;
  expiresAt: string;
  createdAt: string;
  totalFloors: number;
  totalUnits: number;
  managementType: string;
  contractType: string;
  rules: string[];
  photos: Photo[];
  amenities?: Amenity[];
  conditionReport?: ConditionReport | null;
  unitTypes: UnitType[];
  landlord: Landlord;
  price: number; // starting price (minRent)
  minRent: number;
  maxRent: number;
  bedrooms: number;
  bathrooms: number;
  vacantCount: number;
  _count?: { savedBy: number };
}

export type Listing = Property;

interface ListingsFilters {
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  propertyType?: string;
  area?: string;
}

interface ListingsResponse {
  listings: Listing[];
  properties: Property[];
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
    staleTime: 0,
  });
}

export function useListing(id: string) {
  return useQuery<{ listing: Listing; property: Property }>({
    queryKey: ["listings", id],
    queryFn: () => api.get(`/api/listings/${id}`) as Promise<{ listing: Listing; property: Property }>,
    enabled: !!id,
  });
}
