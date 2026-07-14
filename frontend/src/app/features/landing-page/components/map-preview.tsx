"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import { ArrowRight } from "lucide-react";

export function MapPreview() {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    import("leaflet").then((L) => {
      if (!mapRef.current || (mapRef.current as any)._leaflet_id) return;

      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current!, {
        center: [-1.2921, 36.8219],
        zoom: 12,
        zoomControl: false,
        scrollWheelZoom: false,
        dragging: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
      }).addTo(map);

      // Force map to recalculate container size so it fills the div correctly
      setTimeout(() => {
        map.invalidateSize();
      }, 100);

      // Sample price pins for Nairobi areas
      const pins = [
        { lat: -1.2673, lng: 36.8127, price: "KES 32K", area: "Westlands" },
        { lat: -1.2921, lng: 36.7823, price: "KES 28K", area: "Kilimani" },
        { lat: -1.3192, lng: 36.7532, price: "KES 45K", area: "Karen" },
        { lat: -1.2610, lng: 36.8310, price: "KES 58K", area: "Parklands" },
      ];

      pins.forEach(({ lat, lng, price, area }) => {
        const icon = L.divIcon({
          className: "",
          html: `<div style="background:#2d6a4f;color:white;padding:5px 12px;border-radius:20px;font-size:12px;font-weight:700;white-space:nowrap;box-shadow:0 2px 10px rgba(0,0,0,0.25);letter-spacing:0.3px">${price}</div>`,
          iconAnchor: [30, 16],
        });
        L.marker([lat, lng], { icon }).addTo(map).bindPopup(area);
      });
    });
  }, []);

  return (
    <section className="px-6 py-20 bg-muted/30">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Explore verified properties across Nairobi
            </h2>
            <p className="mt-2 text-muted-foreground">
              Browse the map to find listings in your preferred neighbourhood.
            </p>
          </div>
          <Link
            href="/map"
            className="hidden sm:flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium hover:border-secondary hover:text-secondary transition-colors"
          >
            Open Full Map <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div
          ref={mapRef}
          className="h-80 w-full rounded-2xl border border-border overflow-hidden shadow-md"
        />

        <div className="mt-4 sm:hidden">
          <Link
            href="/map"
            className="flex items-center justify-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium hover:border-secondary hover:text-secondary transition-colors"
          >
            Open Full Map <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
