"use client";

/**
 * Location Picker Component
 *
 * Allows agents to set property location via:
 * - Direct address input
 * - Google Maps link (extracts coordinates)
 * - Manual coordinates
 *
 * Supports precision levels for partial addresses.
 */

import { useState, useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

interface LocationPickerProps {
  address: string;
  latitude: number | null;
  longitude: number | null;
  precision: number | null; // null = exact, otherwise radius in meters
  onAddressChange: (address: string) => void;
  onCoordinatesChange: (lat: number | null, lng: number | null) => void;
  onPrecisionChange: (precision: number | null) => void;
  city: string; // For geocoding fallback
}

const PRECISION_OPTIONS = [
  { value: null, label: "Exact address", description: "Pin shows exact location" },
  { value: 100, label: "Street level", description: "~100m radius circle" },
  { value: 500, label: "Neighborhood", description: "~500m radius circle" },
  { value: 1000, label: "City area", description: "~1km radius circle" },
];

/**
 * Extract coordinates from various Google Maps URL formats
 */
function parseGoogleMapsUrl(url: string): { lat: number; lng: number } | null {
  // Format: https://www.google.com/maps/@41.9028,12.4964,15z
  // Format: https://www.google.com/maps/place/.../@41.9028,12.4964,15z
  // Format: https://maps.google.com/?q=41.9028,12.4964
  // Format: https://www.google.com/maps?q=41.9028,12.4964
  // Format: https://goo.gl/maps/... (short URL - can't parse without redirect)

  const patterns = [
    /@(-?\d+\.?\d*),(-?\d+\.?\d*)/,           // @lat,lng format
    /[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/,      // ?q=lat,lng format
    /[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/,     // ?ll=lat,lng format
    /place\/[^/]+\/(-?\d+\.?\d*),(-?\d+\.?\d*)/, // place/name/lat,lng format
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { lat, lng };
      }
    }
  }

  return null;
}

/**
 * Check if input looks like a Google Maps URL
 */
function isGoogleMapsUrl(input: string): boolean {
  return input.includes("google.com/maps") || input.includes("maps.google.com") || input.includes("goo.gl/maps");
}

/**
 * Check if input looks like coordinates (lat, lng)
 */
function parseCoordinates(input: string): { lat: number; lng: number } | null {
  const match = input.match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);
  if (match) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng };
    }
  }
  return null;
}

export default function LocationPicker({
  address,
  latitude,
  longitude,
  precision,
  onAddressChange,
  onCoordinatesChange,
  onPrecisionChange,
  city,
}: LocationPickerProps) {
  const [locationInput, setLocationInput] = useState("");
  const [inputMode, setInputMode] = useState<"address" | "maps" | "coordinates">("address");
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize location input from props
  useEffect(() => {
    if (address && !locationInput) {
      setLocationInput(address);
      setInputMode("address");
    }
  }, [address]);

  // Handle input change - detect if it's a Google Maps URL or coordinates
  const handleInputChange = (value: string) => {
    setLocationInput(value);
    setGeocodeError(null);

    if (isGoogleMapsUrl(value)) {
      setInputMode("maps");
      const coords = parseGoogleMapsUrl(value);
      if (coords) {
        onCoordinatesChange(coords.lat, coords.lng);
        // Don't clear address - keep existing or set from reverse geocode later
      }
    } else if (parseCoordinates(value)) {
      setInputMode("coordinates");
      const coords = parseCoordinates(value);
      if (coords) {
        onCoordinatesChange(coords.lat, coords.lng);
      }
    } else {
      setInputMode("address");
      onAddressChange(value);
      // Clear coordinates when address changes - they'll be set on geocode
      onCoordinatesChange(null, null);
    }
  };

  // Geocode the address
  const handleGeocode = async () => {
    if (!locationInput.trim()) return;

    // If already have coordinates from Google Maps URL, skip geocoding
    if (inputMode === "maps" || inputMode === "coordinates") {
      return;
    }

    setGeocoding(true);
    setGeocodeError(null);

    try {
      // Use Nominatim (OpenStreetMap) for geocoding - free, no API key
      const query = encodeURIComponent(`${locationInput}, ${city}, Italy`);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`,
        {
          headers: {
            "User-Agent": "ItalianProperties/1.0",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Geocoding service unavailable");
      }

      const results = await response.json();

      if (results.length === 0) {
        setGeocodeError("Location not found. Try adding more details or use a Google Maps link.");
        return;
      }

      const result = results[0];
      onCoordinatesChange(parseFloat(result.lat), parseFloat(result.lon));

      // Suggest precision based on result type
      if (result.type === "house" || result.type === "building") {
        onPrecisionChange(null); // Exact
      } else if (result.type === "street" || result.type === "road") {
        onPrecisionChange(100); // Street level
      } else {
        onPrecisionChange(500); // Neighborhood
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      setGeocodeError("Failed to find location. Try using a Google Maps link instead.");
    } finally {
      setGeocoding(false);
    }
  };

  // Initialize preview map when coordinates are available
  useEffect(() => {
    if (!mapRef.current || latitude === null || longitude === null) return;

    let map: L.Map | null = null;
    let marker: L.Marker | null = null;
    let circle: L.Circle | null = null;

    const initMap = async () => {
      const L = (await import("leaflet")).default;

      if (!mapRef.current) return;

      // Check if map already initialized
      if ((mapRef.current as HTMLElement & { _leaflet_id?: number })._leaflet_id) {
        // Get existing map instance and update it
        return;
      }

      map = L.map(mapRef.current).setView([latitude, longitude], precision ? 14 : 16);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);

      // Custom marker icon
      const markerIcon = L.divIcon({
        className: "custom-marker",
        html: `<div style="width: 24px; height: 24px; background: #C4724C; border: 2px solid white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      if (precision) {
        // Show circle for uncertain location
        circle = L.circle([latitude, longitude], {
          radius: precision,
          color: "#C4724C",
          fillColor: "#C4724C",
          fillOpacity: 0.2,
          weight: 2,
        }).addTo(map);

        // Fit map to circle bounds
        map.fitBounds(circle.getBounds(), { padding: [20, 20] });
      } else {
        // Show marker for exact location
        marker = L.marker([latitude, longitude], { icon: markerIcon }).addTo(map);
      }

      setMapLoaded(true);
    };

    initMap();

    return () => {
      if (map) {
        map.remove();
      }
    };
  }, [latitude, longitude, precision]);

  const hasCoordinates = latitude !== null && longitude !== null;

  return (
    <div className="space-y-4">
      {/* Location Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Location
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={locationInput}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Enter address, paste Google Maps link, or coordinates (lat, lng)"
            className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {inputMode === "address" && locationInput && (
            <button
              type="button"
              onClick={handleGeocode}
              disabled={geocoding}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {geocoding ? "Finding..." : "Find"}
            </button>
          )}
        </div>

        {/* Input mode indicator */}
        <div className="mt-1 flex items-center gap-2 text-xs">
          {inputMode === "maps" && (
            <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Coordinates extracted from Google Maps link
            </span>
          )}
          {inputMode === "coordinates" && (
            <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Using entered coordinates
            </span>
          )}
          {geocodeError && (
            <span className="text-red-600 dark:text-red-400">{geocodeError}</span>
          )}
        </div>
      </div>

      {/* Precision Selector */}
      {hasCoordinates && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Location Precision
          </label>
          <div className="grid grid-cols-2 gap-2">
            {PRECISION_OPTIONS.map((option) => (
              <button
                key={option.value ?? "exact"}
                type="button"
                onClick={() => onPrecisionChange(option.value)}
                className={`px-3 py-2 rounded-lg border text-left transition-colors ${
                  precision === option.value
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                    : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                }`}
              >
                <div className="font-medium text-sm">{option.label}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{option.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Map Preview */}
      {hasCoordinates && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Location Preview
          </label>
          <div
            ref={mapRef}
            className="w-full h-48 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600"
            style={{ zIndex: 1 }}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Coordinates: {latitude?.toFixed(6)}, {longitude?.toFixed(6)}
            {precision && ` (showing ~${precision}m radius)`}
          </p>
        </div>
      )}

      {/* Help text */}
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Tip: For privacy, you can set a larger precision radius to show the general area without revealing the exact address.
      </p>
    </div>
  );
}
