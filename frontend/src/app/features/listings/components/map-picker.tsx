"use client";

import { useEffect, useRef } from "react";
import { MapPin } from "lucide-react";

interface MapPickerProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}

const DEFAULT_LAT = -1.2921;
const DEFAULT_LNG = 36.8219;

const STREET_TILE = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const SATELLITE_TILE = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const LABELS_TILE = "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}";
const ROADS_TILE = "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}";

export function MapPicker({ lat, lng, onChange }: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const streetLayerRef = useRef<any>(null);
  const satLayerRef = useRef<any>(null);
  const labelsLayerRef = useRef<any>(null);
  const roadsLayerRef = useRef<any>(null);
  const isSatRef = useRef(false);
  const toggleBtnRef = useRef<HTMLButtonElement>(null);
  const fullscreenBtnRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    import("leaflet").then((L) => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current!).setView(
        [lat || DEFAULT_LAT, lng || DEFAULT_LNG],
        13
      );

      const streetLayer = L.tileLayer(STREET_TILE, {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      const satLayer = L.tileLayer(SATELLITE_TILE, {
        attribution: "© Esri World Imagery",
        maxZoom: 19,
      });

      const labelsLayer = L.tileLayer(LABELS_TILE, {
        attribution: "© Esri",
        maxZoom: 19,
        pane: "shadowPane",
      });

      const roadsLayer = L.tileLayer(ROADS_TILE, {
        attribution: "© Esri",
        maxZoom: 19,
        pane: "shadowPane",
      });

      streetLayerRef.current = streetLayer;
      satLayerRef.current = satLayer;
      labelsLayerRef.current = labelsLayer;
      roadsLayerRef.current = roadsLayer;

      const marker = L.marker([lat || DEFAULT_LAT, lng || DEFAULT_LNG], {
        draggable: true,
      }).addTo(map);

      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        onChange(pos.lat, pos.lng);
      });

      map.on("click", (e: any) => {
        marker.setLatLng([e.latlng.lat, e.latlng.lng]);
        onChange(e.latlng.lat, e.latlng.lng);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;

      // Wire up satellite toggle button
      if (toggleBtnRef.current) {
        toggleBtnRef.current.onclick = () => {
          const m = mapInstanceRef.current;
          if (!m) return;
          if (isSatRef.current) {
            m.removeLayer(satLayerRef.current);
            m.removeLayer(labelsLayerRef.current);
            m.removeLayer(roadsLayerRef.current);
            streetLayerRef.current.addTo(m);
            isSatRef.current = false;
            if (toggleBtnRef.current) toggleBtnRef.current.title = "Switch to Satellite";
            if (toggleBtnRef.current) toggleBtnRef.current.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>Satellite`;
          } else {
            m.removeLayer(streetLayerRef.current);
            satLayerRef.current.addTo(m);
            roadsLayerRef.current.addTo(m);
            labelsLayerRef.current.addTo(m);
            isSatRef.current = true;
            if (toggleBtnRef.current) toggleBtnRef.current.title = "Switch to Street";
            if (toggleBtnRef.current) toggleBtnRef.current.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 11 19-9-9 19-2-8-8-2z"/></svg>Street`;
          }
        };
      }

      // Wire up fullscreen button
      if (fullscreenBtnRef.current) {
        fullscreenBtnRef.current.onclick = () => {
          const el = containerRef.current;
          if (!el) return;
          if (!document.fullscreenElement) {
            el.requestFullscreen().then(() => {
              setTimeout(() => map.invalidateSize(), 200);
            });
          } else {
            document.exitFullscreen();
          }
        };
      }

      document.addEventListener("fullscreenchange", () => {
        if (document.fullscreenElement) {
          if (mapRef.current) mapRef.current.style.height = "100%";
        } else {
          if (mapRef.current) mapRef.current.style.height = "16rem";
        }
        setTimeout(() => mapInstanceRef.current?.invalidateSize(), 100);
      });
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <MapPin className="h-4 w-4 text-secondary" />
        Click on the map or drag the pin to set the exact location
      </div>
      <div ref={containerRef} className="relative rounded-xl overflow-hidden border border-border">
        {/* Map Controls */}
        <div className="absolute top-2 right-2 z-[1000] flex flex-col gap-1.5">
          <button
            ref={toggleBtnRef}
            type="button"
            title="Switch to Satellite"
            className="flex items-center gap-1.5 rounded-lg bg-white/90 backdrop-blur-sm px-2.5 py-1.5 text-xs font-semibold text-gray-800 shadow-md border border-white/60 hover:bg-white transition-colors"
            style={{ pointerEvents: "auto" }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
            Satellite
          </button>
          <button
            ref={fullscreenBtnRef}
            type="button"
            title="Toggle Fullscreen"
            className="flex items-center gap-1.5 rounded-lg bg-white/90 backdrop-blur-sm px-2.5 py-1.5 text-xs font-semibold text-gray-800 shadow-md border border-white/60 hover:bg-white transition-colors"
            style={{ pointerEvents: "auto" }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
            Fullscreen
          </button>
        </div>
        <div
          ref={mapRef}
          className="h-64 w-full z-0"
        />
      </div>
      {lat && lng && (
        <p className="text-xs text-muted-foreground">
          Pin: {lat.toFixed(5)}, {lng.toFixed(5)}
        </p>
      )}
    </div>
  );
}
