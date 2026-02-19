/**
 * Property Location Map Component
 *
 * Displays a Leaflet map showing the property location.
 * Uses OpenStreetMap tiles (free, no API key required).
 */

"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface PropertyLocationMapProps {
  latitude: number;
  longitude: number;
  address?: string | null;
  city: string;
}

export function PropertyLocationMap({
  latitude,
  longitude,
  address,
  city,
}: PropertyLocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize the map
    const map = L.map(mapRef.current).setView([latitude, longitude], 15);
    mapInstanceRef.current = map;

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Custom marker icon
    const markerIcon = L.divIcon({
      className: "custom-marker",
      html: `
        <div style="
          width: 32px;
          height: 32px;
          background: var(--color-terracotta, #C4724C);
          border: 3px solid white;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        "></div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });

    // Add marker
    const marker = L.marker([latitude, longitude], { icon: markerIcon }).addTo(
      map
    );

    // Add popup with address
    if (address) {
      marker.bindPopup(
        `<div style="font-family: system-ui; font-size: 14px;">
          <strong>${city}</strong><br/>
          ${address}
        </div>`
      );
    }

    setIsLoaded(true);

    // Cleanup
    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [latitude, longitude, address, city]);

  return (
    <section className="bg-[var(--color-cream)] dark:bg-gray-800 rounded-xl p-6 sm:p-8 border border-[var(--color-sand)] dark:border-gray-700">
      <h2 className="font-display text-2xl text-[var(--color-text)] dark:text-gray-200 mb-4 flex items-center gap-3">
        <span className="w-8 h-0.5 bg-[var(--color-terracotta)]" />
        Location
      </h2>

      {address && (
        <p className="text-[var(--color-text-muted)] dark:text-gray-400 mb-4 flex items-center gap-2">
          <svg
            className="w-4 h-4 text-[var(--color-terracotta)]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
            />
          </svg>
          {address}
        </p>
      )}

      <div
        ref={mapRef}
        className="w-full h-[300px] sm:h-[400px] rounded-lg overflow-hidden"
        style={{ zIndex: 1 }}
      />

      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-stone)]">
          <div className="animate-pulse text-[var(--color-text-muted)]">
            Loading map...
          </div>
        </div>
      )}
    </section>
  );
}
