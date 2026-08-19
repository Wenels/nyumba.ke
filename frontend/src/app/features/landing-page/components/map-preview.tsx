"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, MapPin, Sparkles } from "lucide-react";
import { useListings, type Listing } from "@/app/features/listings/hooks/use-listings";
import "leaflet/dist/leaflet.css";

const NAIROBI_CENTER = { lat: -1.2921, lng: 36.8219 };

interface MapPinItem {
  lat: number;
  lng: number;
  price: string;
  vacant: boolean;
  verified: boolean;
}

export function MapPreview() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [isMapReady, setIsMapReady] = useState(false);

  const { data } = useListings();
  const realListings = data?.listings ?? [];

  // Init Map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    import("leaflet").then((L) => {
      if (!mapRef.current) return;
      delete (L.Icon.Default.prototype as any)._getIconUrl;

      const map = L.map(mapRef.current, {
        center: [NAIROBI_CENTER.lat, NAIROBI_CENTER.lng],
        zoom: 12,
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: false,
        dragging: true,
      });

      // Official Google Maps Roadmap Tiles
      L.tileLayer("https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
        subdomains: ["0", "1", "2", "3"],
        maxZoom: 20,
      }).addTo(map);

      mapInstanceRef.current = map;
      setIsMapReady(true);

      // ResizeObserver to prevent split tiles
      const ro = new ResizeObserver(() => { map.invalidateSize(); });
      ro.observe(mapRef.current);

      requestAnimationFrame(() => {
        map.invalidateSize();
        setTimeout(() => map.invalidateSize(), 300);
      });

      (map as any)._roCleanup = () => ro.disconnect();
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

  // Update Markers when real listings arrive or fallback to demo pins
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapReady) return;

    import("leaflet").then((L) => {
      const map = mapInstanceRef.current;
      for (const m of markersRef.current) m.remove();
      markersRef.current = [];

      const bounds = L.latLngBounds([]);

      // Map real listings or fallback demo pins
      const pinItems: MapPinItem[] = realListings.length > 0
        ? realListings.map((l: Listing) => ({
            lat: l.latitude,
            lng: l.longitude,
            price: `KES ${(l.price / 1000).toFixed(0)}K`,
            vacant: (l.vacantCount ?? 1) > 0,
            verified: l.landlord?.verification === "VERIFIED",
          }))
        : [
            { lat: -1.2673, lng: 36.8127, price: "KES 32K", vacant: true, verified: true  },
            { lat: -1.2921, lng: 36.7823, price: "KES 28K", vacant: true, verified: true  },
            { lat: -1.3192, lng: 36.7532, price: "KES 45K", vacant: false, verified: true },
            { lat: -1.2610, lng: 36.8310, price: "KES 58K", vacant: true, verified: true  },
            { lat: -1.3050, lng: 36.8250, price: "KES 22K", vacant: false, verified: false },
          ];

      pinItems.forEach(({ lat, lng, price, vacant, verified }: MapPinItem) => {
        if (!lat || !lng) return;
        bounds.extend([lat, lng]);

        const color  = vacant ? "#16a34a" : "#dc2626";
        const shadow = vacant ? "rgba(22,163,74,0.45)" : "rgba(220,38,38,0.45)";
        const verifiedBadgeHtml = verified
          ? `<span style="background:#2563eb;color:white;width:13px;height:13px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:8px;font-weight:900;line-height:1;margin-right:3px;box-shadow:0 1px 3px rgba(37,99,235,0.5);">✓</span>`
          : "";

        const icon = L.divIcon({
          className: "",
          html: `<div style="position:absolute;transform:translate(-50%,-100%);display:inline-flex;flex-direction:column;align-items:center;pointer-events:auto;">
            <div style="background:${color};color:white;font-size:12px;font-weight:800;padding:6px 14px;border-radius:999px;white-space:nowrap;box-shadow:0 3px 12px ${shadow};letter-spacing:-0.2px;line-height:1.2;cursor:pointer;display:inline-flex;align-items:center;">
              ${verifiedBadgeHtml}
              ${price}
            </div>
            <div style="width:8px;height:8px;border-radius:50%;background:${color};margin-top:4px;box-shadow:0 2px 6px ${shadow};"></div>
          </div>`,
          iconAnchor: [0, 0],
          iconSize: [0, 0],
        });
        const marker = L.marker([lat, lng], { icon }).addTo(map);
        markersRef.current.push(marker);
      });

      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      }
    });
  }, [realListings, isMapReady]);

  return (
    <section data-tour="map-preview" className="relative z-0 isolate px-6 py-20 bg-muted/30">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">
              <Sparkles className="h-4 w-4" /> Interactive Nairobi Map
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
              Explore verified properties across Nairobi Wards
            </h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-xl">
              Browse interactive property pins across Kilimani, Westlands, Lavington, Karen, Parklands, and South B/C.
            </p>
          </div>
          <Link
            href="/browse"
            className="hidden sm:flex items-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 text-xs font-bold transition-all shadow-md"
          >
            Open Full Interactive Map <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Clickable Map Gateway */}
        <div className="group relative w-full rounded-3xl overflow-hidden shadow-2xl border border-border">
          <div
            ref={mapRef}
            className="relative z-0 h-96 w-full rounded-3xl bg-muted"
          />

          {/* Official Google Maps Branding */}
          <div className="absolute bottom-2 left-3 z-10 flex items-center gap-1 bg-white/80 backdrop-blur-xs px-2 py-0.5 rounded text-[11px] font-semibold shadow-xs">
            <span className="font-extrabold text-blue-600 tracking-tighter text-xs">G</span>
            <span className="font-extrabold text-red-500 tracking-tighter text-xs">o</span>
            <span className="font-extrabold text-yellow-500 tracking-tighter text-xs">o</span>
            <span className="font-extrabold text-blue-600 tracking-tighter text-xs">g</span>
            <span className="font-extrabold text-emerald-600 tracking-tighter text-xs">l</span>
            <span className="font-extrabold text-red-500 tracking-tighter text-xs">e</span>
          </div>

          <div className="absolute bottom-2 right-3 z-10 bg-white/80 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] text-gray-500 font-medium shadow-xs">
            Map data ©2026 Google
          </div>

          {/* Interactive Overlay Badge */}
          <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-slate-950/10 transition-colors flex items-center justify-center p-4 z-10 pointer-events-none">
            <Link
              href="/browse"
              className="pointer-events-auto flex items-center gap-2.5 rounded-full bg-white/95 backdrop-blur-md px-6 py-3 text-xs font-extrabold text-gray-900 shadow-2xl border border-white/40 group-hover:scale-105 transition-transform"
            >
              <MapPin className="h-4 w-4 text-emerald-600" />
              <span>Click to open full Nairobi Map view →</span>
            </Link>
          </div>
        </div>

        <div className="mt-4 sm:hidden">
          <Link
            href="/browse"
            className="flex items-center justify-center gap-2 rounded-full bg-emerald-600 text-white px-5 py-3 text-xs font-bold hover:bg-emerald-700 transition-colors shadow-md"
          >
            Open Full Interactive Map <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
