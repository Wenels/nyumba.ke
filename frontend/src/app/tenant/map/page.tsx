"use client";

import { useState } from "react";
import { useListings } from "@/app/features/listings/hooks/use-listings";
import { useDebounce } from "@/hooks/use-debounce";
import { GooglePropertyMap } from "@/components/ui/google-map";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";

export default function TenantMapPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const { data, isLoading, refetch } = useListings({ area: debouncedSearch });
  const listings = data?.listings ?? [];

  return (
    <div className="relative -mx-6 -my-6 h-[calc(100vh-64px)] w-[calc(100%+3rem)] overflow-hidden">
      {/* Integrated Floating Top-Center Search Bar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 w-full max-w-md px-4">
        <div className="relative shadow-xl rounded-full">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type to filter — Karen, Kilimani, Westlands..."
            className="pl-10 pr-10 py-2.5 text-xs font-semibold rounded-full bg-white/95 backdrop-blur-md border-gray-200 shadow-md text-gray-900 placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-emerald-500"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Full Viewport Edge-to-Edge Map (Matches Screenshot 1 to the pixel) */}
      <GooglePropertyMap
        listings={listings}
        isLoading={isLoading}
        onRefresh={() => refetch()}
        heightClass="h-full w-full"
      />
    </div>
  );
}
