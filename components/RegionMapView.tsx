/**
 * Region Map View Component
 *
 * Displays a map view of properties for a region page.
 * Wraps PropertyMap with region-specific configuration.
 */

"use client";

import { PropertyMap, PropertyMapSkeleton } from "./PropertyMap";
import type { PropertySummary } from "@/types";

// Region center coordinates
const regionCenters: Record<string, [number, number]> = {
  tuscany: [43.4, 11.1],
  calabria: [38.9, 16.3],
  puglia: [40.8, 17.2],
};

interface RegionMapViewProps {
  properties: PropertySummary[];
  regionSlug: string;
  regionName: string;
}

export function RegionMapView({ properties, regionSlug, regionName }: RegionMapViewProps) {
  // Filter properties that have valid coordinates
  const mappableProperties = properties
    .filter((p) => p.latitude !== null && p.longitude !== null && !isNaN(p.latitude) && !isNaN(p.longitude))
    .map((p) => ({
      id: p.id,
      city: p.city,
      price_eur: p.price_eur,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      property_type: p.property_type,
      thumbnail_url: p.image_urls?.[0] || null,
      latitude: Number(p.latitude),
      longitude: Number(p.longitude),
    }));

  const unmappableCount = properties.length - mappableProperties.length;

  return (
    <div className="space-y-4">
      {/* Map Stats Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 bg-white rounded-lg border border-[var(--color-sand)]">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[var(--color-terracotta)]" />
            <span className="text-[var(--color-text-muted)]">
              <strong className="text-[var(--color-text)]">{mappableProperties.length}</strong> properties on map
            </span>
          </div>
          {unmappableCount > 0 && (
            <div className="flex items-center gap-2 text-[var(--color-text-light)]">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <span>{unmappableCount} without coordinates</span>
            </div>
          )}
        </div>
        <div className="text-xs text-[var(--color-text-light)]">
          Click markers for details · Scroll to zoom
        </div>
      </div>

      {/* Map */}
      {mappableProperties.length > 0 ? (
        <PropertyMap
          properties={mappableProperties}
          center={regionCenters[regionSlug] || [42.5, 12.5]}
          zoom={8}
          className="h-[500px] sm:h-[600px] lg:h-[650px]"
          enableClustering={true}
        />
      ) : (
        <div className="h-[500px] bg-[var(--color-cream)] rounded-xl border border-[var(--color-sand)] flex items-center justify-center">
          <div className="text-center p-8">
            <svg
              className="w-16 h-16 mx-auto text-[var(--color-text-light)] mb-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
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
            <h3 className="font-display text-xl text-[var(--color-text)] mb-2">
              No Map Data Available
            </h3>
            <p className="text-[var(--color-text-muted)] max-w-sm">
              Properties in {regionName} don&apos;t have location coordinates yet.
              Switch to Grid view to browse listings.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export { PropertyMapSkeleton };
