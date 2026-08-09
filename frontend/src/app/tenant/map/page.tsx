"use client";

import {
  Bath,
  BedDouble,
  ExternalLink,
  ImageOff,
  MapPin,
  Search,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  type Listing,
  useListings,
} from "@/app/features/listings/hooks/use-listings";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// Nairobi centre coordinates
const NAIROBI = { lat: -1.2921, lng: 36.8219 };

export default function TenantMapPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<unknown[]>([]);
  const streetLayerRef = useRef<any>(null);
  const satLayerRef = useRef<any>(null);
  const labelsLayerRef = useRef<any>(null);
  const roadsLayerRef = useRef<any>(null);
  const isSatRef = useRef(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Listing | null>(null);
  const [isSat, setIsSat] = useState(false);

  // Debounce the search input — 400ms delay before querying the API
  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading } = useListings({ area: debouncedSearch });
  const listings = data?.listings ?? [];

  // Boot up the map once
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    import("leaflet").then((L) => {
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)
        ._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current!).setView(
        [NAIROBI.lat, NAIROBI.lng],
        12,
      );

      const streetLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      const satLayer = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
        attribution: "© Esri World Imagery",
        maxZoom: 19,
      });

      const labelsLayer = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}", {
        attribution: "© Esri",
        maxZoom: 19,
      });

      const roadsLayer = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}", {
        attribution: "© Esri",
        maxZoom: 19,
      });

      streetLayerRef.current = streetLayer;
      satLayerRef.current = satLayer;
      labelsLayerRef.current = labelsLayer;
      roadsLayerRef.current = roadsLayer;
      mapInstanceRef.current = map;
    });

    return () => {
      if (mapInstanceRef.current) {
        (mapInstanceRef.current as { remove: () => void }).remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Add/refresh markers whenever listings change
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    import("leaflet").then((L) => {
      // Remove old markers
      for (const m of markersRef.current) {
        (m as { remove: () => void }).remove();
      }
      markersRef.current = [];

      const map = mapInstanceRef.current as {
        addLayer: (l: unknown) => void;
      };

      for (const listing of listings) {
        if (!listing.latitude || !listing.longitude) continue;

        const icon = L.divIcon({
          className: "",
          html: `<div style="background:#10b981;color:#fff;font-size:11px;font-weight:700;padding:4px 8px;border-radius:999px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.25);border:2px solid #fff;">Ksh ${(listing.price / 1000).toFixed(0)}k</div>`,
          iconAnchor: [0, 0],
        });

        const marker = L.marker([listing.latitude, listing.longitude], { icon });
        marker.on("click", () => setSelected(listing));
        (map as unknown as { addLayer: (l: unknown) => void }).addLayer(marker);
        markersRef.current.push(marker);
      }
    });
  }, [listings]);

  // (handleSearch removed — search is now live via debouncedSearch)

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] space-y-0">
      {/* Top search bar */}
      <div className="flex items-center gap-3 px-1 pb-4">
        <h1 className="text-xl font-bold tracking-tight shrink-0">Map View</h1>
        {/* Live search bar — debounced, no button press needed */}
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type to filter — Karen, Kilimani..."
            className="pl-9 pr-9 text-sm"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!search}
          onClick={() => setSearch("")}
          className="shrink-0 text-destructive border-destructive/30 hover:bg-destructive/10 disabled:opacity-40"
        >
          Clear
        </Button>
        <span className="text-xs text-muted-foreground shrink-0">
          {isLoading ? "Loading..." : `${listings.length} listings`}
        </span>
      </div>

      {/* Map + panel */}
      <div ref={mapContainerRef} className="relative flex-1 rounded-xl overflow-hidden border border-border">
        {/* Leaflet map */}
        <div ref={mapRef} className="absolute inset-0 z-0" />

        {/* Map controls: satellite + fullscreen */}
        <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => {
              const m = mapInstanceRef.current as any;
              if (!m) return;
              if (isSat) {
                m.removeLayer(satLayerRef.current);
                m.removeLayer(labelsLayerRef.current);
                m.removeLayer(roadsLayerRef.current);
                streetLayerRef.current.addTo(m);
                setIsSat(false);
              } else {
                m.removeLayer(streetLayerRef.current);
                satLayerRef.current.addTo(m);
                roadsLayerRef.current.addTo(m);
                labelsLayerRef.current.addTo(m);
                setIsSat(true);
              }
            }}
            className="flex items-center gap-1.5 rounded-lg bg-white/90 backdrop-blur-sm px-2.5 py-1.5 text-xs font-semibold text-gray-800 shadow-md border border-white/60 hover:bg-white transition-colors"
          >
            {isSat ? (
              <><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 11 19-9-9 19-2-8-8-2z"/></svg>Street</>
            ) : (
              <><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>Satellite</>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              const el = mapContainerRef.current;
              if (!el) return;
              if (!document.fullscreenElement) {
                el.requestFullscreen().then(() => {
                  setTimeout(() => (mapInstanceRef.current as any)?.invalidateSize(), 50);
                  setTimeout(() => (mapInstanceRef.current as any)?.invalidateSize(), 300);
                });
              } else {
                document.exitFullscreen().then(() => {
                  setTimeout(() => (mapInstanceRef.current as any)?.invalidateSize(), 100);
                });
              }
            }}
            className="flex items-center gap-1.5 rounded-lg bg-white/90 backdrop-blur-sm px-2.5 py-1.5 text-xs font-semibold text-gray-800 shadow-md border border-white/60 hover:bg-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
            Fullscreen
          </button>
        </div>

        {/* Selected listing panel */}
        {selected && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[500] w-80 rounded-2xl border border-border bg-background shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
            {/* Photo */}
            <div className="relative aspect-[16/7] bg-muted">
              {selected.photos?.[0] ? (
                <Image
                  src={`${API_URL}${selected.photos[0].url}`}
                  alt={selected.title}
                  fill
                  sizes="320px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <ImageOff className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              {/* Close button */}
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-bold text-secondary text-lg">
                    Ksh {selected.price.toLocaleString()}
                    <span className="text-sm font-normal text-muted-foreground">
                      /mo
                    </span>
                  </p>
                  <p className="mt-0.5 text-sm font-semibold truncate">
                    {selected.title}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                  {selected.propertyType}
                </span>
              </div>

              <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="line-clamp-1">{selected.address}</span>
              </p>

              <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <BedDouble className="h-3.5 w-3.5" />
                  {selected.bedrooms} bed
                </span>
                <span className="flex items-center gap-1">
                  <Bath className="h-3.5 w-3.5" />
                  {selected.bathrooms} bath
                </span>
              </div>

              <Link
                href={`/listings/${selected.slug}`}
                className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground hover:bg-secondary/90 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                View Listing
              </Link>
            </div>
          </div>
        )}

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-[400] flex items-center justify-center bg-background/60 backdrop-blur-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        )}
      </div>
    </div>
  );
}
