/**
 * Professione Immobiliare Italia Scraper
 *
 * Scrapes property listings from https://www.professioneimmobiliareitalia.it
 * This agency covers the Calabria region, primarily the Tyrrhenian Coast.
 *
 * Strategy:
 * - Uses WordPress REST API to get list of cities with property counts
 * - Fetches each city archive page which contains embedded JSON with full property data
 * - Visits each property detail page to get the full description
 * - Extracts price, images, features from the embedded MyHome theme data
 */

import { BaseScraper } from "./base";
import { ScraperSourceConfig } from "../types";
import { SOURCES } from "../config";
import { PropertyInsert, PropertyType } from "@/types";

/**
 * City data from WordPress taxonomy API
 */
interface CityTaxonomy {
  id: number;
  name: string;
  slug: string;
  count: number;
}

/**
 * Estate data from WordPress REST API
 * This provides the `modified` field that embedded JSON lacks
 */
interface EstateApiResponse {
  id: number;
  date: string;           // Publication date (ISO 8601)
  modified: string;       // Last modified date (ISO 8601) - THIS IS WHAT WE WANT
  slug: string;
  link: string;
  title: { rendered: string };
}

/**
 * Estate data embedded in city archive pages
 */
interface EmbeddedEstate {
  id: number;
  name: string;
  slug: string;
  excerpt: string;
  link: string;
  image: string;
  gallery: Array<{ image: string; alt: string }>;
  price: Array<{ price: string; is_range: boolean }>;
  attributes: Array<{
    name: string;
    slug: string;
    values: Array<{ name: string; value: string }>;
  }>;
}

/**
 * Professione Immobiliare Italia scraper implementation
 */
export class ProfessioneImmobiliareScraper extends BaseScraper {
  readonly config: ScraperSourceConfig = SOURCES.professioneimmobiliare;

  /**
   * Fetch JSON from WordPress REST API
   */
  private async fetchJson<T>(path: string): Promise<T> {
    const url = `${this.config.baseUrl}${path}`;
    const html = await this.fetchPage(url);
    return JSON.parse(html) as T;
  }

  /**
   * Get all cities with properties from WordPress taxonomy
   */
  private async getCitiesWithProperties(): Promise<CityTaxonomy[]> {
    const cities = await this.fetchJson<CityTaxonomy[]>("/wp-json/wp/v2/citt?per_page=100");
    return cities.filter(c => c.count > 0);
  }

  /**
   * Fetch all estates from WordPress REST API with pagination
   * Returns a map of estate ID to modified date for quick lookup
   */
  private async fetchEstateModifiedDates(): Promise<Map<number, Date>> {
    const modifiedDates = new Map<number, Date>();
    let page = 1;
    let hasMore = true;

    this.log("Fetching estate modified dates from REST API...");

    while (hasMore) {
      try {
        const url = `/wp-json/wp/v2/estate?per_page=100&page=${page}`;
        const estates = await this.fetchJson<EstateApiResponse[]>(url);

        if (estates.length === 0) {
          hasMore = false;
          break;
        }

        for (const estate of estates) {
          modifiedDates.set(estate.id, new Date(estate.modified));
        }

        this.log(`  Page ${page}: fetched ${estates.length} estate dates`);
        page++;

        // Safety limit to avoid infinite loops
        if (page > 50) {
          this.log("  Reached safety limit of 50 pages");
          break;
        }

        await this.delay();
      } catch (error) {
        // WordPress returns 400 when page is out of range
        hasMore = false;
      }
    }

    this.log(`  Total: ${modifiedDates.size} estate modified dates fetched`);
    return modifiedDates;
  }

  /**
   * Extract embedded estates data from city archive page HTML
   */
  private extractEstatesFromPage(html: string): EmbeddedEstate[] {
    const searchStart = html.indexOf('"estates":');
    if (searchStart === -1) return [];

    const arrayStart = html.indexOf("[", searchStart);
    if (arrayStart === -1) return [];

    // Find matching closing bracket
    let depth = 0;
    let arrayEnd = arrayStart;
    for (let i = arrayStart; i < html.length && i < arrayStart + 200000; i++) {
      if (html[i] === "[") depth++;
      else if (html[i] === "]") depth--;
      if (depth === 0) {
        arrayEnd = i + 1;
        break;
      }
    }

    try {
      const estatesStr = html.slice(arrayStart, arrayEnd);
      return JSON.parse(estatesStr);
    } catch {
      return [];
    }
  }

  /**
   * Get attribute value from estate data
   */
  private getAttributeValue(estate: EmbeddedEstate, slug: string): string | null {
    const attr = estate.attributes?.find(a => a.slug === slug);
    return attr?.values?.[0]?.value || null;
  }

  /**
   * Parse price from embedded format (e.g., "€155.000" -> 155000)
   */
  private parsePriceFromEmbedded(estate: EmbeddedEstate): number | null {
    const priceStr = estate.price?.[0]?.price;
    if (!priceStr) return null;

    // Remove € and any spaces, then handle European number format
    const cleaned = priceStr.replace(/[€\s]/g, "").replace(/\./g, "").replace(",", ".");
    const price = parseFloat(cleaned);
    return isNaN(price) ? null : Math.round(price);
  }

  /**
   * Infer property type from Italian type name
   */
  private inferPropertyType(typeName: string | null): PropertyType {
    if (!typeName) return "other";
    const lower = typeName.toLowerCase();

    if (lower.includes("appartament")) return "apartment";
    if (lower.includes("villa")) return "villa";
    if (lower.includes("indipendente") || lower.includes("bifamiliare")) return "townhouse";
    if (lower.includes("rustico") || lower.includes("casale")) return "farmhouse";
    if (lower.includes("attico") || lower.includes("penthouse")) return "penthouse";
    if (lower.includes("monolocale") || lower.includes("studio")) return "studio";
    if (lower.includes("terreno")) return "land";
    if (lower.includes("commerciale") || lower.includes("negozio") || lower.includes("locale") ||
        lower.includes("capannone") || lower.includes("fabbricato") || lower.includes("magazzino")) return "commercial";

    return "other";
  }

  /**
   * Extract features from caratteristiche attribute
   */
  private extractFeatures(estate: EmbeddedEstate): {
    hasGarden: boolean;
    hasTerrace: boolean;
    hasBalcony: boolean;
    hasParking: boolean;
    hasGarage: boolean;
    hasSeaView: boolean;
  } {
    const features = estate.attributes?.find(a => a.slug === "caratteristiche")?.values || [];
    const featureText = features.map(f => f.value.toLowerCase()).join(" ");

    return {
      hasGarden: featureText.includes("giardino"),
      hasTerrace: featureText.includes("terrazzo") || featureText.includes("terrazza"),
      hasBalcony: featureText.includes("balcon"),
      hasParking: featureText.includes("parcheggio") || featureText.includes("posto auto"),
      hasGarage: featureText.includes("garage") || featureText.includes("box"),
      hasSeaView: featureText.includes("vista mare") || featureText.includes("fronte mare"),
    };
  }

  /**
   * Get full-size image URLs from gallery
   */
  private getImageUrls(estate: EmbeddedEstate): string[] {
    const images: string[] = [];

    // Add main image (get full size by removing size suffix)
    if (estate.image) {
      const fullImage = estate.image.replace(/-\d+x\d+\./, ".");
      images.push(fullImage);
    }

    // Add gallery images
    if (estate.gallery) {
      for (const item of estate.gallery) {
        if (item.image) {
          const fullImage = item.image.replace(/-\d+x\d+\./, ".");
          if (!images.includes(fullImage)) {
            images.push(fullImage);
          }
        }
      }
    }

    return images;
  }

  /**
   * Normalize city name for consistency
   */
  private normalizeCityName(name: string): string {
    // Capitalize first letter of each word
    return name
      .split(/[\s-]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  /**
   * Fetch full description from property detail page
   * The embedded JSON only contains truncated excerpts, so we need to visit
   * each detail page to get the complete description.
   */
  private async fetchFullDescription(detailUrl: string): Promise<string | null> {
    try {
      const html = await this.fetchPage(detailUrl);
      const root = this.parseHtml(html);

      // Look for the description section (MyHome theme structure)
      const descriptionSection = root.querySelector(".mh-estate__section--description p");
      if (descriptionSection) {
        // Get text content and clean up whitespace
        let description = descriptionSection.textContent?.trim() || null;
        if (description) {
          // Normalize whitespace and remove excessive line breaks
          description = description.replace(/\s+/g, " ").trim();
        }
        return description;
      }

      // Fallback: try og:description meta tag (still truncated but better than excerpt)
      const ogDesc = root.querySelector('meta[property="og:description"]');
      if (ogDesc) {
        const content = ogDesc.getAttribute("content");
        if (content && !content.includes("[&hellip;]")) {
          return content.trim();
        }
      }

      return null;
    } catch (error) {
      this.logError(`Error fetching detail page: ${detailUrl}`, error);
      return null;
    }
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

    // First, fetch all modified dates from REST API
    // This gives us exact timestamps for when listings were updated
    const modifiedDates = await this.fetchEstateModifiedDates();

    // Get cities with properties
    this.log("Fetching cities from WordPress API...");
    const cities = await this.getCitiesWithProperties();
    this.log(`Found ${cities.length} cities with properties`);

    const allProperties: PropertyInsert[] = [];
    const seenIds = new Set<number>();

    // Fetch each city's archive page
    for (let i = 0; i < cities.length; i++) {
      const city = cities[i];
      this.log(`[${i + 1}/${cities.length}] Fetching ${city.name} (${city.count} properties)...`);

      await this.delay();

      try {
        const cityUrl = `${this.config.baseUrl}/citt/${city.slug}/`;
        const html = await this.fetchPage(cityUrl);
        const estates = this.extractEstatesFromPage(html);

        this.log(`  Extracted ${estates.length} properties from page`);

        // Collect estates to process (filter duplicates and invalid prices first)
        const estatesToProcess: EmbeddedEstate[] = [];
        for (const estate of estates) {
          if (seenIds.has(estate.id)) continue;
          seenIds.add(estate.id);

          const price = this.parsePriceFromEmbedded(estate);
          if (!price || price < 1000) {
            this.log(`  Skipping ${estate.name?.slice(0, 30)} - no valid price`);
            continue;
          }
          estatesToProcess.push(estate);
        }

        // Process each estate, fetching full description from detail page
        for (let j = 0; j < estatesToProcess.length; j++) {
          const estate = estatesToProcess[j];
          const price = this.parsePriceFromEmbedded(estate)!;

          // Fetch full description from detail page
          this.log(`    [${j + 1}/${estatesToProcess.length}] Fetching details: ${estate.name?.slice(0, 40)}...`);
          await this.delay();
          const fullDescription = await this.fetchFullDescription(estate.link);

          const cityName = this.getAttributeValue(estate, "citt") || city.name;
          const propertyType = this.getAttributeValue(estate, "tipo-propriet");
          const bedrooms = this.getAttributeValue(estate, "bedrooms");
          const bathrooms = this.getAttributeValue(estate, "bathrooms");
          const size = this.getAttributeValue(estate, "property-size");
          const features = this.extractFeatures(estate);
          const imageUrls = this.getImageUrls(estate);

          // Look up the modified date from REST API data
          const sourceUpdatedAt = modifiedDates.get(estate.id) || null;

          // Get description and translate to English
          const descriptionIt = fullDescription || estate.excerpt?.replace(/\.\.\.$/, "") || null;
          this.log(`    Translating description...`);
          const descriptionEn = await this.translateDescription(descriptionIt);

          // Extract living area: prefer description-based (actual living area) over listed total
          const listedArea = size ? parseInt(size, 10) : null;
          const livingAreaFromDesc = this.extractLivingAreaFromDescription(descriptionIt);
          const livingArea = livingAreaFromDesc ?? listedArea;

          if (livingAreaFromDesc && listedArea && livingAreaFromDesc < listedArea) {
            this.log(`    Living area: ${livingAreaFromDesc} mq (from description, listed: ${listedArea} mq)`);
          }

          const property: PropertyInsert = {
            region_id: regionId,
            source_id: sourceId,
            city: this.normalizeCityName(cityName),
            price_eur: price,
            bedrooms: bedrooms ? parseInt(bedrooms, 10) : null,
            bathrooms: bathrooms ? parseInt(bathrooms, 10) : null,
            living_area_sqm: livingArea,
            property_type: this.inferPropertyType(propertyType),
            image_urls: imageUrls,
            description_it: descriptionIt,
            description_en: descriptionEn,
            listing_url: estate.link,
            has_sea_view: features.hasSeaView || null,
            has_garden: features.hasGarden || null,
            has_terrace: features.hasTerrace || null,
            has_balcony: features.hasBalcony || null,
            has_parking: features.hasParking || features.hasGarage || null,
            has_garage: features.hasGarage || null,
            source_updated_at: sourceUpdatedAt,
          };

          allProperties.push(property);
        }
      } catch (error) {
        this.logError(`Error fetching ${city.name}`, error);
      }
    }

    this.log(`\nTotal unique properties: ${allProperties.length}`);
    return allProperties;
  }
}

/**
 * Factory function to create a Professione Immobiliare scraper instance
 */
export function createProfessioneImmobiliareScraper(): ProfessioneImmobiliareScraper {
  return new ProfessioneImmobiliareScraper();
}
