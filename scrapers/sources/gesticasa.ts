/**
 * Gesticasa Immobiliare Scraper
 *
 * Scrapes property listings from https://www.gesticasaimmobiliare.it
 * This agency covers the Calabria region, primarily the Tyrrhenian Coast.
 *
 * Strategy:
 * - Fetches the main listings page which contains all properties (no pagination)
 * - Extracts property IDs from onclick handlers
 * - Visits each property detail page to get full data (description, images, location)
 */

import { BaseScraper } from "./base";
import { ScraperSourceConfig } from "../types";
import { SOURCES } from "../config";
import { PropertyInsert, PropertyType } from "@/types";

/**
 * Property data extracted from detail page
 */
interface PropertyDetail {
  id: string;
  price: number | null;
  city: string | null;
  address: string | null;
  propertyType: string | null;
  sqm: number | null;
  rooms: number | null;
  bathrooms: number | null;
  floor: string | null;
  description: string | null;
  imageUrls: string[];
}

/**
 * Gesticasa scraper implementation
 */
export class GesticasaScraper extends BaseScraper {
  readonly config: ScraperSourceConfig = SOURCES.gesticasa;

  private readonly listingsPath = "/index.php?action=immobili";

  /**
   * Extract all property IDs from the listings page
   */
  private extractPropertyIds(html: string): string[] {
    const ids: string[] = [];
    // Match onclick handlers: immobile.value = '993'
    const regex = /card-box-a[^>]*onclick[^>]*immobile\.value\s*=\s*'([0-9*]+)'/g;
    let match;
    while ((match = regex.exec(html)) !== null) {
      const id = match[1];
      if (!ids.includes(id)) {
        ids.push(id);
      }
    }
    return ids;
  }

  /**
   * Fetch and parse a property detail page
   */
  private async fetchPropertyDetail(propertyId: string): Promise<PropertyDetail | null> {
    try {
      const url = `${this.config.baseUrl}/index.php?action=schedaImmobile&immobile=${propertyId}`;
      const html = await this.fetchPage(url);
      const root = this.parseHtml(html);

      // Extract price from .property-price .title-c
      let price: number | null = null;
      const priceEl = root.querySelector(".property-price .title-c");
      if (priceEl) {
        const priceText = priceEl.textContent || "";
        // Parse €145.000,00 format
        const cleaned = priceText.replace(/[€\s]/g, "").replace(/\./g, "").replace(",", ".");
        price = parseFloat(cleaned);
        if (isNaN(price)) price = null;
        else price = Math.round(price);
      }

      // Extract location from Ubicazione section
      let city: string | null = null;
      let address: string | null = null;
      const ubicazioneSection = html.match(/Ubicazione<\/h3>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i);
      if (ubicazioneSection) {
        const locationText = ubicazioneSection[1].replace(/<[^>]+>/g, "").trim();
        // Format: "Belvedere Marittimo, Contrada Oracchio -..."
        const parts = locationText.split(",");
        if (parts.length >= 1) {
          city = parts[0].trim();
        }
        if (parts.length >= 2) {
          // Get address without the Google Maps link part
          address = parts[1].split("|")[0].split("-")[0].trim();
        }
      }

      // Extract property details from .summary-list
      let propertyType: string | null = null;
      let sqm: number | null = null;
      let rooms: number | null = null;
      let bathrooms: number | null = null;
      let floor: string | null = null;

      const summaryItems = root.querySelectorAll(".summary-list .list li");
      for (const item of summaryItems) {
        const text = item.textContent || "";
        const strong = item.querySelector("strong")?.textContent?.toLowerCase() || "";
        const span = item.querySelector("span")?.textContent?.trim() || "";

        if (strong.includes("tipologia")) {
          propertyType = span;
        } else if (strong.includes("superfic")) {
          const sqmMatch = span.match(/(\d+)/);
          if (sqmMatch) sqm = parseInt(sqmMatch[1], 10);
        } else if (strong.includes("locali")) {
          const roomsMatch = span.match(/(\d+)/);
          if (roomsMatch) rooms = parseInt(roomsMatch[1], 10);
        } else if (strong.includes("bagn")) {
          const bathMatch = span.match(/(\d+)/);
          if (bathMatch) bathrooms = parseInt(bathMatch[1], 10);
        } else if (strong.includes("piano")) {
          floor = span;
        }
      }

      // Extract description from .property-description
      let description: string | null = null;
      const descEl = root.querySelector(".property-description .description");
      if (descEl) {
        // Get text content, clean up HTML entities and whitespace
        description = descEl.textContent?.trim() || null;
        if (description) {
          description = description
            .replace(/\s+/g, " ")
            .replace(/CODICE DI RIFERIMENTO.*$/i, "")
            .trim();
        }
      }

      // Extract image URLs
      const imageUrls: string[] = [];
      const imgPattern = new RegExp(`img/immobili/${propertyId}_[^"']+\\.(jpg|jpeg|png)`, "gi");
      let imgMatch;
      while ((imgMatch = imgPattern.exec(html)) !== null) {
        const fullUrl = `${this.config.baseUrl}/${imgMatch[0]}`;
        if (!imageUrls.includes(fullUrl)) {
          imageUrls.push(fullUrl);
        }
      }

      return {
        id: propertyId,
        price,
        city,
        address,
        propertyType,
        sqm,
        rooms,
        bathrooms,
        floor,
        description,
        imageUrls,
      };
    } catch (error) {
      this.logError(`Error fetching property ${propertyId}`, error);
      return null;
    }
  }

  /**
   * Infer property type from Italian type name
   */
  private inferPropertyType(typeName: string | null): PropertyType {
    if (!typeName) return "other";
    const lower = typeName.toLowerCase();

    if (lower.includes("appartament")) return "apartment";
    if (lower.includes("villa")) return "villa";
    if (lower.includes("casa indipendente")) return "townhouse";
    if (lower.includes("attico") || lower.includes("mansarda")) return "penthouse";
    if (lower.includes("rustico") || lower.includes("casale")) return "farmhouse";
    if (lower.includes("monolocale") || lower.includes("studio")) return "studio";
    if (lower.includes("terreno")) return "land";
    if (lower.includes("box") || lower.includes("garage")) return "other";
    if (lower.includes("locale commerciale") || lower.includes("palazzo") || lower.includes("stabile")) return "commercial";

    return "other";
  }

  /**
   * Extract features from description text
   */
  private extractFeatures(description: string | null): {
    hasGarden: boolean;
    hasTerrace: boolean;
    hasBalcony: boolean;
    hasParking: boolean;
    hasGarage: boolean;
    hasSeaView: boolean;
  } {
    const text = (description || "").toLowerCase();

    return {
      hasGarden: text.includes("giardino") && !text.includes("senza giardino"),
      hasTerrace: text.includes("terrazza") || text.includes("terrazzo"),
      hasBalcony: text.includes("balcon"),
      hasParking: text.includes("parcheggio") || text.includes("posto auto"),
      hasGarage: text.includes("garage") || text.includes("box auto"),
      hasSeaView: text.includes("vista mare") || text.includes("vista sul mare"),
    };
  }

  /**
   * Normalize city name for consistency
   */
  private normalizeCityName(name: string): string {
    return name
      .split(/[\s-]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  /**
   * Main scrape method
   */
  async scrape(
    regionId: string,
    sourceId: string,
    regionSlug: string
  ): Promise<PropertyInsert[]> {
    this.log(`Starting scrape for region: ${regionSlug}`);

    // Fetch the main listings page
    const listingsUrl = `${this.config.baseUrl}${this.listingsPath}`;
    this.log(`Fetching listings: ${listingsUrl}`);

    const html = await this.fetchPage(listingsUrl);
    const propertyIds = this.extractPropertyIds(html);
    this.log(`Found ${propertyIds.length} properties`);

    if (propertyIds.length === 0) {
      this.log("No properties found. The page structure may have changed.");
      return [];
    }

    const allProperties: PropertyInsert[] = [];

    // Fetch each property's detail page
    for (let i = 0; i < propertyIds.length; i++) {
      const propertyId = propertyIds[i];
      this.log(`[${i + 1}/${propertyIds.length}] Fetching property ${propertyId}...`);

      await this.delay();
      const detail = await this.fetchPropertyDetail(propertyId);

      if (!detail) {
        this.log(`  Skipped - failed to fetch details`);
        continue;
      }

      if (!detail.price || detail.price < 1000) {
        this.log(`  Skipped - no valid price`);
        continue;
      }

      if (!detail.city) {
        this.log(`  Skipped - no city found`);
        continue;
      }

      const features = this.extractFeatures(detail.description);

      const property: PropertyInsert = {
        region_id: regionId,
        source_id: sourceId,
        city: this.normalizeCityName(detail.city),
        price_eur: detail.price,
        bedrooms: detail.rooms, // "Locali" in Italian usually means rooms, may include living room
        bathrooms: detail.bathrooms,
        living_area_sqm: detail.sqm,
        property_type: this.inferPropertyType(detail.propertyType),
        image_urls: detail.imageUrls,
        description_it: detail.description,
        listing_url: `${this.config.baseUrl}/index.php?action=schedaImmobile&immobile=${propertyId}`,
        has_sea_view: features.hasSeaView || null,
        has_garden: features.hasGarden || null,
        has_terrace: features.hasTerrace || null,
        has_balcony: features.hasBalcony || null,
        has_parking: features.hasParking || features.hasGarage || null,
        has_garage: features.hasGarage || null,
      };

      allProperties.push(property);
      this.log(`  Added: ${detail.city} - €${detail.price.toLocaleString()} - ${detail.imageUrls.length} images`);
    }

    this.log(`\nTotal properties: ${allProperties.length}`);
    return allProperties;
  }
}

/**
 * Factory function to create a Gesticasa scraper instance
 */
export function createGesticasaScraper(): GesticasaScraper {
  return new GesticasaScraper();
}
