/**
 * Property Map Component
 *
 * Displays properties on an interactive Leaflet map.
 * Uses OpenStreetMap tiles (free, no API key required).
 * Supports marker clustering for better performance with many properties.
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// Types for the component
interface MapProperty {
  id: string;
  city: string;
  price_eur: number;
  bedrooms: number | null;
  bathrooms: number | null;
  property_type: string;
  thumbnail_url: string | null;
  latitude: number;
  longitude: number;
}

interface PropertyMapProps {
  properties: MapProperty[];
  center?: [number, number];
  zoom?: number;
  className?: string;
  enableClustering?: boolean;
}

// Property type labels
const propertyTypeLabels: Record<string, string> = {
  apartment: "Appartamento",
  villa: "Villa",
  farmhouse: "Casale",
  townhouse: "Casa a Schiera",
  penthouse: "Attico",
  land: "Terreno",
};

// Format price
function formatPrice(price: number): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(price);
}

export function PropertyMap({
  properties,
  center,
  zoom = 8,
  className = "",
  enableClustering = true,
}: PropertyMapProps) {
  const [MapComponents, setMapComponents] = useState<{
    MapContainer: typeof import("react-leaflet").MapContainer;
    TileLayer: typeof import("react-leaflet").TileLayer;
    Marker: typeof import("react-leaflet").Marker;
    Popup: typeof import("react-leaflet").Popup;
    Tooltip: typeof import("react-leaflet").Tooltip;
    MarkerClusterGroup: typeof import("react-leaflet-cluster").default | null;
  } | null>(null);
  const [L, setL] = useState<typeof import("leaflet") | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Dynamically import Leaflet components (client-side only)
  useEffect(() => {
    const loadMap = async () => {
      try {
        const leaflet = await import("leaflet");
        const reactLeaflet = await import("react-leaflet");

        // Fix for default marker icons in Next.js
        delete (leaflet.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
        leaflet.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
          iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
        });

        // Import clustering if enabled
        let MarkerClusterGroup = null;
        if (enableClustering) {
          try {
            const clusterModule = await import("react-leaflet-cluster");
            MarkerClusterGroup = clusterModule.default;
          } catch (clusterError) {
            console.warn("Failed to load clustering, continuing without it:", clusterError);
            // Continue without clustering
          }
        }

        setL(leaflet);
        setMapComponents({
          MapContainer: reactLeaflet.MapContainer,
          TileLayer: reactLeaflet.TileLayer,
          Marker: reactLeaflet.Marker,
          Popup: reactLeaflet.Popup,
          Tooltip: reactLeaflet.Tooltip,
          MarkerClusterGroup,
        });
      } catch (error) {
        console.error("Failed to load map:", error);
        setLoadError("Failed to load map components");
      }
    };

    loadMap();
  }, [enableClustering]);

  // Calculate center from properties if not provided
  const mapCenter = center || calculateCenter(properties);

  // Show error state if loading failed
  if (loadError) {
    return (
      <div className={`bg-[var(--color-stone-dark)] rounded-xl flex items-center justify-center ${className}`}>
        <div className="text-center p-8">
          <svg
            className="w-12 h-12 mx-auto text-[var(--color-terracotta)] mb-3"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
          <p className="text-[var(--color-text-muted)]">{loadError}</p>
        </div>
      </div>
    );
  }

  // Show loading state while Leaflet loads
  if (!MapComponents || !L) {
    return (
      <div className={`bg-[var(--color-stone-dark)] rounded-xl flex items-center justify-center ${className}`}>
        <div className="text-center">
          <svg
            className="w-12 h-12 mx-auto text-[var(--color-text-light)] animate-pulse mb-3"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z"
            />
          </svg>
          <p className="text-[var(--color-text-muted)]">Loading map...</p>
        </div>
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, Popup, Tooltip, MarkerClusterGroup } = MapComponents;

  // Custom cluster icon creator
  const createClusterCustomIcon = (cluster: { getChildCount: () => number }) => {
    const count = cluster.getChildCount();
    let size = "small";
    let dimensions = 36;

    if (count >= 10 && count < 50) {
      size = "medium";
      dimensions = 44;
    } else if (count >= 50) {
      size = "large";
      dimensions = 52;
    }

    return L.divIcon({
      html: `<div class="cluster-marker cluster-${size}">
        <span>${count}</span>
      </div>`,
      className: "custom-cluster-icon",
      iconSize: L.point(dimensions, dimensions, true),
    });
  };

  // Create custom marker icon
  const customIcon = L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        background-color: var(--color-terracotta, #C4633A);
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ">
        <div style="
          transform: rotate(45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
        ">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="none">
            <path d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
    tooltipAnchor: [16, -16],
  });

  return (
    <div className={`rounded-xl overflow-hidden border border-[var(--color-sand)] ${className}`}>
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        style={{ height: "100%", width: "100%", minHeight: "400px" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {enableClustering && MarkerClusterGroup ? (
          <MarkerClusterGroup
            chunkedLoading
            iconCreateFunction={createClusterCustomIcon}
            maxClusterRadius={60}
            spiderfyOnMaxZoom={true}
            showCoverageOnHover={false}
            zoomToBoundsOnClick={true}
          >
            {properties.map((property) => (
              <Marker
                key={property.id}
                position={[property.latitude, property.longitude]}
                icon={customIcon}
              >
                <Tooltip
                  direction="top"
                  offset={[0, -20]}
                  className="price-tooltip"
                >
                  <span className="font-semibold">{formatPrice(property.price_eur)}</span>
                </Tooltip>
                <Popup>
                  <PropertyPopup property={property} />
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>
        ) : (
          properties.map((property) => (
            <Marker
              key={property.id}
              position={[property.latitude, property.longitude]}
              icon={customIcon}
            >
              <Tooltip
                direction="top"
                offset={[0, -20]}
                className="price-tooltip"
              >
                <span className="font-semibold">{formatPrice(property.price_eur)}</span>
              </Tooltip>
              <Popup>
                <PropertyPopup property={property} />
              </Popup>
            </Marker>
          ))
        )}
      </MapContainer>
    </div>
  );
}

/**
 * Property popup content
 */
function PropertyPopup({ property }: { property: MapProperty }) {
  const typeLabel = propertyTypeLabels[property.property_type] || "Property";

  return (
    <div className="min-w-[200px] max-w-[280px]">
      {/* Image */}
      {property.thumbnail_url && (
        <div
          className="w-full h-32 bg-cover bg-center rounded-t-lg -mt-3 -mx-3 mb-3"
          style={{
            backgroundImage: `url(${property.thumbnail_url})`,
            width: "calc(100% + 24px)",
          }}
        />
      )}

      {/* Content */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-medium px-2 py-0.5 rounded"
            style={{
              backgroundColor: "var(--color-terracotta)",
              color: "white",
            }}
          >
            {typeLabel}
          </span>
        </div>

        <h3 className="font-semibold text-gray-900">{property.city}</h3>

        <p
          className="text-lg font-bold"
          style={{ color: "var(--color-terracotta)" }}
        >
          {formatPrice(property.price_eur)}
        </p>

        {/* Features */}
        <div className="flex gap-3 text-sm text-gray-600">
          {property.bedrooms !== null && (
            <span>{property.bedrooms} beds</span>
          )}
          {property.bathrooms !== null && (
            <span>{property.bathrooms} baths</span>
          )}
        </div>

        {/* View Details Link */}
        <Link
          href={`/property/${property.id}`}
          className="block mt-3 text-center py-2 rounded text-sm font-medium transition-colors"
          style={{
            backgroundColor: "var(--color-terracotta)",
            color: "white",
          }}
        >
          View Details →
        </Link>
      </div>
    </div>
  );
}

/**
 * Calculate the center point from a list of properties
 */
function calculateCenter(properties: MapProperty[]): [number, number] {
  if (properties.length === 0) {
    // Default to central Italy
    return [42.5, 12.5];
  }

  const sum = properties.reduce(
    (acc, p) => ({
      lat: acc.lat + p.latitude,
      lng: acc.lng + p.longitude,
    }),
    { lat: 0, lng: 0 }
  );

  return [sum.lat / properties.length, sum.lng / properties.length];
}

/**
 * Map loading skeleton
 */
export function PropertyMapSkeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`bg-[var(--color-stone-dark)] rounded-xl animate-pulse flex items-center justify-center ${className}`}
    >
      <div className="text-center">
        <svg
          className="w-16 h-16 mx-auto text-[var(--color-text-light)]/30 mb-3"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z"
          />
        </svg>
        <p className="text-[var(--color-text-light)]">Loading map...</p>
      </div>
    </div>
  );
}
