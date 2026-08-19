"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    google: any;
  }
}

interface MapViewProps {
  lat: number;
  lng: number;
}

export function MapView({ lat, lng }: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const [mapType, setMapType] = useState<"roadmap" | "satellite">("roadmap");

  // Dynamically load Google Maps JS SDK
  useEffect(() => {
    if (window.google?.maps) {
      setGoogleLoaded(true);
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
    const scriptId = "google-maps-js-script";

    if (document.getElementById(scriptId)) {
      const checkInterval = setInterval(() => {
        if (window.google?.maps) {
          setGoogleLoaded(true);
          clearInterval(checkInterval);
        }
      }, 200);
      return () => clearInterval(checkInterval);
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => setGoogleLoaded(true);
    script.onerror = () => setGoogleLoaded(false);
    document.head.appendChild(script);
  }, []);

  // Initialize Google Map
  useEffect(() => {
    if (!googleLoaded || !mapContainerRef.current) return;

    const map = new window.google.maps.Map(mapContainerRef.current, {
      center: { lat, lng },
      zoom: 15,
      mapTypeId: mapType,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: true,
      fullscreenControl: true,
    });

    new window.google.maps.Marker({
      position: { lat, lng },
      map,
      title: "Property Location",
    });

    mapInstanceRef.current = map;

    return () => {
      mapInstanceRef.current = null;
    };
  }, [googleLoaded, lat, lng]);

  const toggleMapType = (type: "roadmap" | "satellite") => {
    setMapType(type);
    if (mapInstanceRef.current && window.google?.maps) {
      mapInstanceRef.current.setMapTypeId(type);
    }
  };

  return (
    <div className="relative h-64 w-full rounded-2xl overflow-hidden border border-border shadow-sm bg-muted">
      <div ref={mapContainerRef} className="absolute inset-0 z-0" />

      {/* Top Right Controls */}
      <div className="absolute top-3 right-3 z-10 flex rounded-xl border border-border bg-background/95 p-1 shadow-md backdrop-blur-md">
        <button
          type="button"
          onClick={() => toggleMapType("roadmap")}
          className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
            mapType === "roadmap" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Map
        </button>
        <button
          type="button"
          onClick={() => toggleMapType("satellite")}
          className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
            mapType === "satellite" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Satellite
        </button>
      </div>
    </div>
  );
}
