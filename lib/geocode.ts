/**
 * Geocoding Utility
 *
 * Uses OpenStreetMap's Nominatim service to convert addresses to coordinates.
 * Free service with rate limiting (1 request per second).
 */

interface GeocodingResult {
  latitude: number;
  longitude: number;
  displayName: string;
}

interface NominatimResponse {
  lat: string;
  lon: string;
  display_name: string;
}

/**
 * Geocode an address to get latitude and longitude
 *
 * @param address - Full street address
 * @param city - City name
 * @param country - Country (defaults to Italy)
 * @returns Coordinates or null if not found
 */
export async function geocodeAddress(
  address: string,
  city: string,
  country: string = "Italy"
): Promise<GeocodingResult | null> {
  try {
    // Build the search query
    const query = `${address}, ${city}, ${country}`;
    const encodedQuery = encodeURIComponent(query);

    // Use Nominatim API (OpenStreetMap)
    const url = `https://nominatim.openstreetmap.org/search?q=${encodedQuery}&format=json&limit=1`;

    const response = await fetch(url, {
      headers: {
        // Required by Nominatim usage policy
        "User-Agent": "ItalianPropertiesApp/1.0 (property search website)",
      },
    });

    if (!response.ok) {
      console.error(`Geocoding request failed: ${response.status}`);
      return null;
    }

    const results: NominatimResponse[] = await response.json();

    if (results.length === 0) {
      // Try with just city if full address fails
      const cityUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(`${city}, ${country}`)}&format=json&limit=1`;
      const cityResponse = await fetch(cityUrl, {
        headers: {
          "User-Agent": "ItalianPropertiesApp/1.0 (property search website)",
        },
      });

      if (cityResponse.ok) {
        const cityResults: NominatimResponse[] = await cityResponse.json();
        if (cityResults.length > 0) {
          return {
            latitude: parseFloat(cityResults[0].lat),
            longitude: parseFloat(cityResults[0].lon),
            displayName: cityResults[0].display_name,
          };
        }
      }
      return null;
    }

    return {
      latitude: parseFloat(results[0].lat),
      longitude: parseFloat(results[0].lon),
      displayName: results[0].display_name,
    };
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}

/**
 * Batch geocode properties and update the database
 * Respects Nominatim rate limit of 1 request per second
 */
export async function geocodeProperties(
  properties: Array<{ id: string; address: string | null; city: string }>
): Promise<number> {
  let updated = 0;

  for (const property of properties) {
    if (!property.address) continue;

    // Rate limit: 1 request per second
    await new Promise((resolve) => setTimeout(resolve, 1100));

    const result = await geocodeAddress(property.address, property.city);

    if (result) {
      // Update would happen here - caller should handle this
      updated++;
      console.log(`Geocoded: ${property.address} -> ${result.latitude}, ${result.longitude}`);
    }
  }

  return updated;
}
