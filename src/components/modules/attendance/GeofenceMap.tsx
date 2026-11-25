/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

interface GeofenceMapProps {
  officeLat: number;
  officeLng: number;
  officeName: string;
  maxRadiusMeters: number;
  userLat: number;
  userLng: number;
  isInsideRadius: boolean;
  distanceMeters: number;
}

export function GeofenceMap({
  officeLat,
  officeLng,
  officeName,
  maxRadiusMeters,
  userLat,
  userLng,
  isInsideRadius,
  distanceMeters,
}: GeofenceMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapContextRef = useRef<{
    map: any;
    L: any;
    circle: any;
    userMarker: any;
    polyline: any;
    officeMarker: any;
  } | null>(null);

  const timersRef = useRef<NodeJS.Timeout[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Helper safely checking if map is alive and mounted in DOM
  const isMapAlive = (mapInstance: any) => {
    return (
      mapInstance &&
      mapInstance._container &&
      !mapInstance._destroyed &&
      Boolean((mapInstance._container as any)._leaflet_id)
    );
  };

  // 1. Initialize Map on mount
  useEffect(() => {
    let isMounted = true;
    let resizeObserver: ResizeObserver | null = null;

    const safeTimeout = (fn: () => void, delayMs: number) => {
      const id = setTimeout(() => {
        if (isMounted) fn();
      }, delayMs);
      timersRef.current.push(id);
      return id;
    };

    async function initMap() {
      if (!containerRef.current) return;

      const L = (await import("leaflet")).default;
      if (!isMounted || !containerRef.current) return;

      // Prevent duplicate initialization on same container
      if ((containerRef.current as any)._leaflet_id) {
        return;
      }

      // Initialize map instance
      const map = L.map(containerRef.current, {
        center: [officeLat, officeLng],
        zoom: 16,
        zoomControl: false,
        attributionControl: false,
      });

      // Standard OpenStreetMap Tiles (100% Free, No API Key needed)
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
        crossOrigin: true,
      }).addTo(map);

      // Add Zoom control at bottom right
      L.control.zoom({ position: "bottomright" }).addTo(map);

      // Office Marker Icon (Modern Pill Badge)
      const officeIcon = L.divIcon({
        className: "custom-office-pin",
        html: `
          <div style="background-color: #2B2D31; color: #FFC93C; width: 34px; height: 34px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); border: 2.5px solid white;">
            🏢
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      const officeMarker = L.marker([officeLat, officeLng], {
        icon: officeIcon,
      })
        .bindTooltip(officeName)
        .addTo(map);

      // Geofence Circle around office
      const initColor = isInsideRadius ? "#10B981" : "#F59E0B";
      const circle = L.circle([officeLat, officeLng], {
        radius: maxRadiusMeters,
        color: initColor,
        fillColor: initColor,
        fillOpacity: 0.16,
        weight: 2,
        dashArray: isInsideRadius ? undefined : "6, 6",
      }).addTo(map);

      // User Marker Icon (Pulsing Radar Pin)
      const createUserIcon = (color: string) =>
        L.divIcon({
          className: "custom-user-pin",
          html: `
            <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
              <div style="position: absolute; width: 100%; height: 100%; border-radius: 9999px; background-color: ${color}; opacity: 0.35; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
              <div style="width: 14px; height: 14px; border-radius: 9999px; background-color: ${color}; border: 2.5px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.35);"></div>
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

      const userMarker = L.marker([userLat, userLng], {
        icon: createUserIcon(initColor),
      }).addTo(map);

      // Connecting Polyline
      const polyline = L.polyline(
        [
          [officeLat, officeLng],
          [userLat, userLng],
        ],
        {
          color: initColor,
          weight: 2,
          dashArray: "5, 7",
          opacity: 0.85,
        }
      ).addTo(map);

      // Helper to calculate and apply bounds cleanly
      const applyBounds = () => {
        if (!isMapAlive(map)) return;
        try {
          const bounds = L.latLngBounds([
            [officeLat, officeLng],
            [userLat, userLng],
          ]);
          map.fitBounds(bounds, { padding: [45, 45], maxZoom: 17, animate: false });
        } catch {}
      };

      // Call invalidateSize and apply bounds across multiple ticks so full tile grid loads
      applyBounds();

      safeTimeout(() => {
        if (isMapAlive(map)) {
          map.invalidateSize({ pan: false });
          applyBounds();
        }
      }, 80);

      safeTimeout(() => {
        if (isMapAlive(map)) {
          map.invalidateSize({ pan: false });
          applyBounds();
        }
      }, 250);

      safeTimeout(() => {
        if (isMapAlive(map)) {
          map.invalidateSize({ pan: false });
          applyBounds();
        }
      }, 500);

      // Auto-invalidate when container size changes
      if (typeof ResizeObserver !== "undefined" && containerRef.current) {
        resizeObserver = new ResizeObserver(() => {
          if (isMounted && isMapAlive(map)) {
            map.invalidateSize({ pan: false });
          }
        });
        resizeObserver.observe(containerRef.current);
      }

      mapContextRef.current = {
        map,
        L,
        circle,
        userMarker,
        polyline,
        officeMarker,
      };

      setIsLoaded(true);
    }

    initMap();

    return () => {
      isMounted = false;
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];

      if (resizeObserver) {
        resizeObserver.disconnect();
      }

      if (mapContextRef.current) {
        const { map } = mapContextRef.current;
        if (isMapAlive(map)) {
          try {
            map.stop();
            map.remove();
          } catch {}
        }
        mapContextRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Reactively update markers and bounds when coordinates change
  useEffect(() => {
    if (!mapContextRef.current) return;
    const { map, L, circle, userMarker, polyline, officeMarker } =
      mapContextRef.current;

    if (!isMapAlive(map)) return;

    const currentColor = isInsideRadius ? "#10B981" : "#F59E0B";

    // Update Circle
    circle.setLatLng([officeLat, officeLng]);
    circle.setRadius(maxRadiusMeters);
    circle.setStyle({
      color: currentColor,
      fillColor: currentColor,
      dashArray: isInsideRadius ? undefined : "6, 6",
    });

    // Update Office Marker
    officeMarker.setLatLng([officeLat, officeLng]);

    // Update User Marker
    const userIcon = L.divIcon({
      className: "custom-user-pin",
      html: `
        <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 100%; height: 100%; border-radius: 9999px; background-color: ${currentColor}; opacity: 0.35; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="width: 14px; height: 14px; border-radius: 9999px; background-color: ${currentColor}; border: 2.5px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.35);"></div>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
    userMarker.setIcon(userIcon);
    userMarker.setLatLng([userLat, userLng]);

    // Update Connecting Polyline
    polyline.setLatLngs([
      [officeLat, officeLng],
      [userLat, userLng],
    ]);
    polyline.setStyle({ color: currentColor });

    // Fit bounds smoothly without conflicting animations
    try {
      map.invalidateSize({ pan: false });
      const bounds = L.latLngBounds([
        [officeLat, officeLng],
        [userLat, userLng],
      ]);
      map.fitBounds(bounds, { padding: [45, 45], maxZoom: 17, animate: false });
    } catch {}
  }, [
    officeLat,
    officeLng,
    maxRadiusMeters,
    userLat,
    userLng,
    isInsideRadius,
  ]);

  return (
    <div
      className="relative w-full rounded-xl overflow-hidden border border-[#D9DADC] shadow-xs bg-[#e5e7eb]"
      style={{ height: "320px", minHeight: "320px", width: "100%" }}
    >
      <div
        ref={containerRef}
        className="w-full h-full block"
        style={{ width: "100%", height: "100%", minHeight: "320px" }}
      />

      {!isLoaded && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-zinc-50/80 backdrop-blur-xs text-xs text-[#71757E]">
          <Loader2 className="w-4 h-4 animate-spin mr-2 text-[#2B2D31]" />
          <span>Memuat Peta Geofence...</span>
        </div>
      )}

      {/* Floating Info Pill Over Map */}
      <div className="absolute top-3 left-3 z-[1000] pointer-events-none bg-white/95 backdrop-blur-md border border-[#D9DADC] py-1.5 px-3 rounded-xl shadow-xs text-xs flex items-center gap-2">
        <span
          className={`h-2 w-2 rounded-full ${
            isInsideRadius ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
          }`}
        />
        <span className="font-semibold text-[#2B2D31]">
          {isInsideRadius
            ? "Area WFO (Dalam Radius)"
            : "Luar Radius (Wajib Izin WFH)"}
        </span>
        <span className="text-[#71757E] font-mono tabular-nums text-[11px] border-l border-[#D9DADC] pl-2">
          {distanceMeters}m
        </span>
      </div>
    </div>
  );
}
