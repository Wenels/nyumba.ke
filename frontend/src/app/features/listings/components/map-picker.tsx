"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Maximize2, Minimize2 } from "lucide-react";
import "leaflet/dist/leaflet.css";

interface MapPickerProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}

const DEFAULT_LAT = -1.2921;
const DEFAULT_LNG = 36.8219;

export function MapPicker({ lat, lng, onChange }: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const streetLayerRef = useRef<any>(null);
  const satLayerRef = useRef<any>(null);

  const [mapType, setMapType] = useState<"map" | "satellite">("map");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const currentLat = lat || DEFAULT_LAT;
  const currentLng = lng || DEFAULT_LNG;

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
        center: [currentLat, currentLng],
        zoom: 15,
        zoomControl: true,
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

      // Custom Draggable Location Pin Icon
      const icon = L.divIcon({
        className: "",
        html: `<div style="position:absolute;transform:translate(-50%,-100%);display:inline-flex;flex-direction:column;align-items:center;pointer-events:auto;">
          <div style="background:#2563eb;color:white;font-size:11px;font-weight:800;padding:5px 12px;border-radius:999px;white-space:nowrap;box-shadow:0 3px 12px rgba(37,99,235,0.45);letter-spacing:-0.2px;line-height:1.2;cursor:grab;">
            📍 Drag to Pin Location
          </div>
          <div style="width:9px;height:9px;border-radius:50%;background:#2563eb;margin-top:3px;box-shadow:0 2px 6px rgba(37,99,235,0.4);"></div>
        </div>`,
        iconAnchor: [0, 0],
        iconSize: [0, 0],
      });

      const marker = L.marker([currentLat, currentLng], {
        icon,
        draggable: true,
      }).addTo(map);

      marker.on("dragend", () => {
        const position = marker.getLatLng();
        if (position) {
          onChange(position.lat, position.lng);
        }
      });

      map.on("click", (e: any) => {
        if (e.latlng) {
          marker.setLatLng(e.latlng);
          onChange(e.latlng.lat, e.latlng.lng);
        }
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;

      // ResizeObserver to fix split-tile rendering
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
        markerRef.current = null;
      }
    };
  }, []);

  // Update marker position when props change externally
  useEffect(() => {
    if (markerRef.current && lat && lng) {
      const currentPos = markerRef.current.getLatLng();
      if (!currentPos || Math.abs(currentPos.lat - lat) > 0.0001 || Math.abs(currentPos.lng - lng) > 0.0001) {
        markerRef.current.setLatLng([lat, lng]);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.panTo([lat, lng]);
        }
      }
    }
  }, [lat, lng]);

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

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground flex-wrap gap-2">
        <span className="flex items-center gap-1.5 text-primary font-bold">
          <MapPin className="h-4 w-4" /> Click map or drag blue pin to set exact building location
        </span>
      </div>

      <div ref={containerRef} className="relative rounded-2xl overflow-hidden border border-border shadow-sm h-72 bg-muted">
        <div ref={mapRef} className="absolute inset-0 z-0 h-full w-full" />

        {/* TOP-RIGHT CONTROLS (Map/Satellite Toggle & Fullscreen/Minimize Button) */}
        <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
          {/* Map Type Switcher */}
          <div className="flex rounded-xl border border-gray-200/80 bg-white/95 p-1 shadow-lg backdrop-blur-md">
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

          {/* Fullscreen / Minimize Toggle Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200/80 bg-white/95 px-3 py-2 text-xs font-bold text-gray-800 shadow-lg hover:bg-gray-50 transition-all backdrop-blur-md"
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
      </div>

      {lat && lng && (
        <p className="text-xs font-mono font-semibold text-muted-foreground">
          Pinned Building Coordinates: {lat.toFixed(5)}, {lng.toFixed(5)}
        </p>
      )}
    </div>
  );
}
