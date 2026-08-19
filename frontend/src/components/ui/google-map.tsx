"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { type Listing } from "@/app/features/listings/hooks/use-listings";
import { Button } from "@/components/ui/button";
import {
  MapPin, BedDouble, Bath, ExternalLink, ImageOff,
  RefreshCw, ShieldCheck, Maximize2, Minimize2
} from "lucide-react";
import "leaflet/dist/leaflet.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const NAIROBI_CENTER = { lat: -1.2921, lng: 36.8219 };

interface GooglePropertyMapProps {
  listings: Listing[];
  isLoading?: boolean;
  onRefresh?: () => void;
  heightClass?: string;
}

export function GooglePropertyMap({
  listings,
  isLoading = false,
  onRefresh,
  heightClass = "h-full w-full",
}: GooglePropertyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const streetLayerRef = useRef<any>(null);
  const satLayerRef = useRef<any>(null);

  const [selected, setSelected] = useState<Listing | null>(null);
  const [mapType, setMapType] = useState<"map" | "satellite">("map");
  const [isMapReady, setIsMapReady] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Track Fullscreen state changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = Boolean(document.fullscreenElement);
      setIsFullscreen(isFs);
      setTimeout(() => mapInstanceRef.current?.invalidateSize(), 200);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Initialize Map with Official Google Maps Tiles
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    import("leaflet").then((L) => {
      if (!mapRef.current) return;
      delete (L.Icon.Default.prototype as any)._getIconUrl;

      const map = L.map(mapRef.current, {
        center: [NAIROBI_CENTER.lat, NAIROBI_CENTER.lng],
        zoom: 13,
        zoomControl: false,
        attributionControl: false,
      });

      // Official Google Maps Roadmap Tiles
      const streetLayer = L.tileLayer("https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
        subdomains: ["0", "1", "2", "3"],
        maxZoom: 20,
      }).addTo(map);

      // Official Google Maps Hybrid Satellite Tiles
      const satLayer = L.tileLayer("https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}", {
        subdomains: ["0", "1", "2", "3"],
        maxZoom: 20,
      });

      streetLayerRef.current = streetLayer;
      satLayerRef.current = satLayer;
      mapInstanceRef.current = map;
      setIsMapReady(true);

      // ResizeObserver — fixes split-tile rendering when the container
      // gets its final dimensions after the map has already initialised
      const ro = new ResizeObserver(() => { map.invalidateSize(); });
      ro.observe(mapRef.current);

      // Safety net: also invalidate on window resize
      const onResize = () => map.invalidateSize();
      window.addEventListener("resize", onResize);

      // Initial invalidation across multiple frames to be safe
      requestAnimationFrame(() => {
        map.invalidateSize();
        setTimeout(() => map.invalidateSize(), 300);
        setTimeout(() => map.invalidateSize(), 800);
      });

      (map as any)._roCleanup = () => { ro.disconnect(); window.removeEventListener("resize", onResize); };
    });

    return () => {
      if (mapInstanceRef.current) {
        (mapInstanceRef.current as any)._roCleanup?.();
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        setIsMapReady(false);
      }
    };
  }, []);

  // Toggle Map / Satellite
  const toggleMapType = (type: "map" | "satellite") => {
    setMapType(type);
    const m = mapInstanceRef.current;
    if (!m) return;
    if (type === "map") {
      if (satLayerRef.current) m.removeLayer(satLayerRef.current);
      if (streetLayerRef.current) streetLayerRef.current.addTo(m);
    } else {
      if (streetLayerRef.current) m.removeLayer(streetLayerRef.current);
      if (satLayerRef.current) satLayerRef.current.addTo(m);
    }
  };

  // Render Property Markers (Green = Vacant, Red = Occupied)
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapReady) return;

    import("leaflet").then((L) => {
      for (const m of markersRef.current) m.remove();
      markersRef.current = [];

      const map = mapInstanceRef.current;
      const bounds = L.latLngBounds([]);

      for (const listing of listings) {
        if (!listing.latitude || !listing.longitude) continue;

        bounds.extend([listing.latitude, listing.longitude]);

        const isVacant = (listing.vacantCount ?? listing.totalUnits ?? 1) > 0;
        const isVerified = listing.landlord?.verification === "VERIFIED";
        const color = isVacant ? "#16a34a" : "#dc2626";
        const shadow = isVacant ? "rgba(22,163,74,0.45)" : "rgba(220,38,38,0.45)";
        const priceText = `KES ${(listing.price / 1000).toFixed(0)}k`;

        const verifiedBadgeHtml = isVerified
          ? `<span style="background:#2563eb;color:white;width:13px;height:13px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:8px;font-weight:900;line-height:1;margin-right:3px;box-shadow:0 1px 3px rgba(37,99,235,0.5);">✓</span>`
          : "";

        const icon = L.divIcon({
          className: "",
          html: `<div style="position:absolute;transform:translate(-50%,-100%);display:inline-flex;flex-direction:column;align-items:center;pointer-events:auto;">
            <div style="background:${color};color:white;font-size:12px;font-weight:800;padding:6px 14px;border-radius:999px;white-space:nowrap;box-shadow:0 3px 12px ${shadow};letter-spacing:-0.2px;line-height:1.2;cursor:pointer;display:inline-flex;align-items:center;">
              ${verifiedBadgeHtml}
              ${priceText}
            </div>
            <div style="width:8px;height:8px;border-radius:50%;background:${color};margin-top:4px;box-shadow:0 2px 6px ${shadow};"></div>
          </div>`,
          iconAnchor: [0, 0],
          iconSize: [0, 0],
        });

        const marker = L.marker([listing.latitude, listing.longitude], { icon }).addTo(map);
        marker.on("click", () => {
          setSelected(listing);
          map.panTo([listing.latitude, listing.longitude]);
        });
        markersRef.current.push(marker);
      }

      if (bounds.isValid() && listings.length > 0) {
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
      }
    });
  }, [listings, isMapReady]);

  // Fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setTimeout(() => mapInstanceRef.current?.invalidateSize(), 200);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const vacantCount = listings.filter((l) => (l.vacantCount ?? l.totalUnits ?? 1) > 0).length;

  return (
    <div ref={containerRef} className={`relative overflow-hidden bg-background ${heightClass}`}>
      {/* Google Maps Tile Div */}
      <div ref={mapRef} className="absolute inset-0 z-0 h-full w-full" />

      {/* TOP-LEFT OVERLAY CARD */}
      <div className="absolute top-4 left-4 z-10 w-56 rounded-2xl border border-gray-200/80 bg-white/95 p-4 shadow-xl backdrop-blur-md space-y-2.5">
        <div>
          <h2 className="text-sm font-extrabold text-gray-900 tracking-tight">
            {listings.length} Verified Properties
          </h2>
          <p className="text-xs font-semibold text-emerald-600 mt-0.5">
            {vacantCount} with vacant units
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 py-2 text-xs font-bold text-gray-700 transition-all shadow-xs"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-gray-500 ${isLoading ? "animate-spin" : ""}`} />
          Refresh Listings
        </button>
      </div>

      {/* TOP-RIGHT MAP / SATELLITE TOGGLE */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <div className="flex rounded-xl border border-gray-200 bg-white/95 p-1 shadow-lg backdrop-blur-md">
          <button
            type="button"
            onClick={() => toggleMapType("map")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              mapType === "map" ? "bg-white text-gray-900 shadow-md font-extrabold" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Map
          </button>
          <button
            type="button"
            onClick={() => toggleMapType("satellite")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              mapType === "satellite" ? "bg-white text-gray-900 shadow-md font-extrabold" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Satellite
          </button>
        </div>

        <button
          type="button"
          onClick={toggleFullscreen}
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white/95 px-3 py-2 text-xs font-bold text-gray-800 shadow-lg hover:bg-gray-50 transition-all backdrop-blur-md"
        >
          {isFullscreen ? (
            <>
              <Minimize2 className="h-3.5 w-3.5 text-blue-600" />
              <span>Minimize</span>
            </>
          ) : (
            <>
              <Maximize2 className="h-3.5 w-3.5 text-gray-600" />
              <span>Fullscreen</span>
            </>
          )}
        </button>
      </div>

      {/* BOTTOM-LEFT LEGEND */}
      <div className="absolute bottom-6 left-4 z-10 w-48 rounded-2xl border border-gray-200/80 bg-white/95 p-4 shadow-xl backdrop-blur-md space-y-2.5">
        <p className="text-xs font-extrabold uppercase tracking-wider text-gray-900 border-b border-gray-100 pb-1.5">
          Legend
        </p>
        <div className="space-y-2 text-xs font-bold">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center shrink-0">
              <span className="bg-blue-600 text-white h-4 w-4 rounded-full flex items-center justify-center text-[9px] font-black shadow-xs">✓</span>
            </div>
            <span className="text-gray-800">Verified Building</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="flex flex-col items-center gap-0.5 shrink-0">
              <div className="h-3 w-8 rounded-full bg-green-600" />
              <div className="h-1.5 w-1.5 rounded-full bg-green-600" />
            </div>
            <span className="text-gray-800">Vacant Units</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="flex flex-col items-center gap-0.5 shrink-0">
              <div className="h-3 w-8 rounded-full bg-red-600" />
              <div className="h-1.5 w-1.5 rounded-full bg-red-600" />
            </div>
            <span className="text-gray-800">Fully Occupied</span>
          </div>
        </div>
      </div>

      {/* Google Branding Footer */}
      <div className="absolute bottom-1.5 left-2 z-10 flex items-center gap-[1px] bg-white/80 backdrop-blur-xs px-2 py-0.5 rounded text-[11px] font-semibold shadow-xs select-none">
        <span className="font-extrabold text-blue-600 text-xs">G</span>
        <span className="font-extrabold text-red-500 text-xs">o</span>
        <span className="font-extrabold text-yellow-500 text-xs">o</span>
        <span className="font-extrabold text-blue-600 text-xs">g</span>
        <span className="font-extrabold text-emerald-600 text-xs">l</span>
        <span className="font-extrabold text-red-500 text-xs">e</span>
      </div>
      <div className="absolute bottom-1.5 right-2 z-10 bg-white/80 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] text-gray-500 font-medium shadow-xs select-none">
        Map data ©2026 Google · Terms
      </div>

      {/* SELECTED PROPERTY POPUP */}
      {selected && (
        <div className="absolute bottom-6 right-6 z-20 w-80 rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="relative aspect-[16/8] bg-gray-100">
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
                <ImageOff className="h-8 w-8 text-gray-400" />
              </div>
            )}
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black text-xs font-bold"
            >
              ✕
            </button>
          </div>

          <div className="p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-extrabold text-emerald-600 text-lg">
                  Ksh {selected.price?.toLocaleString()}
                  <span className="text-xs font-normal text-gray-500">/mo</span>
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <p className="text-xs font-bold text-gray-900 truncate max-w-[170px]">{selected.title}</p>
                  {selected.landlord?.verification === "VERIFIED" && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-extrabold text-blue-700">
                      <ShieldCheck className="h-2.5 w-2.5 text-blue-600" /> Verified
                    </span>
                  )}
                </div>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                (selected.vacantCount ?? 1) > 0 ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
              }`}>
                {(selected.vacantCount ?? 1) > 0 ? "Vacant" : "Occupied"}
              </span>
            </div>

            <p className="flex items-center gap-1 text-xs text-gray-500">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
              <span className="truncate">{selected.address}</span>
            </p>

            <div className="flex items-center gap-3 text-xs text-gray-600 pt-1">
              <span className="flex items-center gap-1"><BedDouble className="h-3.5 w-3.5 text-gray-400" /> {selected.bedrooms} bed</span>
              <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5 text-gray-400" /> {selected.bathrooms} bath</span>
            </div>

            <Link href={`/listings/${selected.slug}`}>
              <Button size="sm" className="w-full gap-2 font-bold text-xs mt-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                <ExternalLink className="h-3.5 w-3.5" /> View Listing Details
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
