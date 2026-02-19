/**
 * Casa Amola Scraper
 *
 * Scrapes property listings from https://casaamola.it
 * This agency covers the Puglia region, primarily around Mola di Bari.
 *
 * Features:
 * - Fetches all properties from the main listings page
 * - Visits each property detail page to extract full gallery and description
 * - Extracts features (bedrooms, bathrooms, garage, etc.)
 */

import { BaseScraper } from "./base";
import { ScraperSourceConfig } from "../types";
import { SOURCES } from "../config";
import { PropertyInsert, PropertyType } from "@/types";

/**
 * Raw listing data extracted from HTML before normalization
 */
interface RawListing {
  title: string;
  url: string;
  imageUrl: string | null;
  priceText: string;
  city: string;
  address: string | null;  // Full address from listing card
  sqmText: string | null;
  bedroomsText: string | null;
  bathroomsText: string | null;
  garageText: string | null;
  propertyType: string;
}

/**
 * Detail page data extracted from property page
 */
interface DetailPageData {
  imageUrls: string[];
  fullDescription: string | null;
  address: string | null;
  hasGarden: boolean;
  hasTerrace: boolean;
  hasBalcony: boolean;
  hasParking: boolean;
  hasGarage: boolean;
}

/**
 * Casa Amola scraper implementation
 */
export class CasaAmolaScraper extends BaseScraper {
  readonly config: ScraperSourceConfig = SOURCES.casaamola;

  private readonly listingsPath = "/immobili-disponibili/";

  /**
   * Infer property type from Italian title/type
   */
  private inferPropertyType(title: string, typeText: string): PropertyType {
    const combined = `${title} ${typeText}`.toLowerCase();

    if (combined.includes("appartament")) return "apartment";
    if (combined.includes("villa")) return "villa";
    if (combined.includes("rustico") || combined.includes("casale") || combined.includes("masseria")) return "farmhouse";
    if (combined.includes("indipendente") || combined.includes("bifamiliare")) return "townhouse";
    if (combined.includes("attico") || combined.includes("mansard") || combined.includes("penthouse")) return "penthouse";
    if (combined.includes("monolocale") || combined.includes("studio")) return "studio";
    if (combined.includes("terreno") || combined.includes("agricolo")) return "land";
    if (combined.includes("commerciale") || combined.includes("negozio") || combined.includes("ufficio") || combined.includes("magazzino") || combined.includes("locale")) return "commercial";

    return "other";
  }

  /**
   * Extract date from WordPress upload paths
   *
   * WordPress organizes uploads by year/month:
   * - /uploads/2025/12/FOTO1-660x600.png
   * - /wp-content/uploads/2026/01/image.jpg
   *
   * Returns the latest date found (month-level precision)
   */
  private extractDateFromImagePaths(imageUrls: string[]): Date | null {
    // Pattern matches: /uploads/YYYY/MM/
    const pattern = /uploads\/(\d{4})\/(\d{2})\//;

    let latestDate: Date | null = null;

    for (const url of imageUrls) {
      const match = url.match(pattern);
      if (match) {
        const year = parseInt(match[1], 10);
        const month = parseInt(match[2], 10);
        // Use day 28 as a safe "end of month" approximation
        const date = new Date(year, month - 1, 28);

        if (!isNaN(date.getTime()) && (!latestDate || date > latestDate)) {
          latestDate = date;
        }
      }
    }

    return latestDate;
  }

  /**
   * Extract city from location text
   * Format: "Contrada Brenca, Mola di Bari" or "Via Roma, Conversano"
   * We want the city name (usually after the comma)
   */
  private extractCity(locationText: string): string {
    // Clean up the location text - remove the map marker icon text if present
    const cleaned = locationText.replace(/^\s*map-marker\s*/i, "").trim();

    // If it contains comma, the city is usually after the last comma
    let city = "";
    if (cleaned.includes(",")) {
      const parts = cleaned.split(",");
      // Take the last part which is usually the city
      city = parts[parts.length - 1].trim();
    }

    // If no city found from comma split, check for known Puglia cities in the text
    if (!city) {
      const knownCities = ["Mola di Bari", "Conversano", "Bari", "Noicattaro", "Rutigliano", "Polignano"];
      for (const knownCity of knownCities) {
        if (cleaned.toLowerCase().includes(knownCity.toLowerCase())) {
          return knownCity;
        }
      }
      return cleaned || "Mola di Bari"; // Default to Mola di Bari
    }

    // Fix common misspellings from source data
    const cityCorrections: Record<string, string> = {
      "noiccataro": "Noicattaro",  // Double 'c' typo on source website
    };

    const corrected = cityCorrections[city.toLowerCase()];
    if (corrected) {
      return corrected;
    }

    return city;
  }

  /**
   * Extract listings from the main listings page
   */
  private extractListings(html: string): RawListing[] {
    const root = this.parseHtml(html);
    const listings: RawListing[] = [];

    // Casa Amola uses article.property-listing-simple for each property card
    const propertyCards = root.querySelectorAll("article.property-listing-simple");

    this.log(`Found ${propertyCards.length} property cards on page`);

    for (const card of propertyCards) {
      try {
        // Extract link and title from h3.entry-title a
        const titleLink = card.querySelector("h3.entry-title a");
        if (!titleLink) continue;

        const href = titleLink.getAttribute("href") || "";
        const title = titleLink.textContent?.trim() || "";

        if (!href || !title || href.includes("immobili-disponibili")) continue;

        // Extract price from span.price
        const priceEl = card.querySelector("span.price");
        const priceText = priceEl?.textContent?.trim() || "";

        // Skip rentals (monthly prices indicated by "mese" or in affitto section)
        const cardText = card.textContent || "";
        if (cardText.toLowerCase().includes("mese") || cardText.toLowerCase().includes("in affitto")) {
          this.log(`Skipping rental: ${title}`);
          continue;
        }

        // Extract image from .property-thumbnail img
        const imgEl = card.querySelector(".property-thumbnail img");
        const imageUrl = imgEl?.getAttribute("src") || null;

        // Extract location from p.property-address
        const locationEl = card.querySelector("p.property-address");
        const locationText = locationEl?.textContent?.trim() || "";
        const city = this.extractCity(locationText);

        // Clean the full address - remove map-marker prefix
        const fullAddress = locationText.replace(/^\s*map-marker\s*/i, "").trim() || null;

        // Extract features from .property-meta
        // Format: "Area 5866", "Camere da letto 3", "Bagni 2", "Garage 1"
        const areaMatch = cardText.match(/Area\s*(\d+)/i);
        const bedsMatch = cardText.match(/Camere\s*(?:da\s*letto)?\s*(\d+)/i);
        const bathsMatch = cardText.match(/Bagn[oi]\s*(\d+)/i);
        const garageMatch = cardText.match(/Garage\s*(\d+)/i);

        // Get property type from meta if available
        const typeEl = card.querySelector(".meta-property-type");
        const propertyType = typeEl?.textContent?.trim() || "";

        listings.push({
          title,
          url: href,
          imageUrl,
          priceText,
          city,
          address: fullAddress,
          sqmText: areaMatch ? areaMatch[1] : null,
          bedroomsText: bedsMatch ? bedsMatch[1] : null,
          bathroomsText: bathsMatch ? bathsMatch[1] : null,
          garageText: garageMatch ? garageMatch[1] : null,
          propertyType,
        });
      } catch (error) {
        this.logError("Error parsing property card", error);
      }
    }

    return listings;
  }

  /**
   * Fetch and parse a property detail page
   */
  private async fetchDetailPage(url: string): Promise<DetailPageData> {
    const defaultData: DetailPageData = {
      imageUrls: [],
      fullDescription: null,
      address: null,
      hasGarden: false,
      hasTerrace: false,
      hasBalcony: false,
      hasParking: false,
      hasGarage: false,
    };

    try {
      const html = await this.fetchPage(url);
      const root = this.parseHtml(html);

      // Extract images from gallery
      const imageUrls: string[] = [];

      // Try various gallery selectors
      const galleryImages = root.querySelectorAll(
        ".gallery img, .property-gallery img, .property-detail-slider img, " +
        ".rh_property__images img, ul.slides img, .flexslider img, " +
        "a[href*='wp-content/uploads'] img, .property-detail-media img"
      );

      for (const img of galleryImages) {
        const src = img.getAttribute("data-src") || img.getAttribute("src");
        const fullSrc = img.closest("a")?.getAttribute("href") || src;
        if (fullSrc && fullSrc.includes("wp-content/uploads") && !imageUrls.includes(fullSrc)) {
          imageUrls.push(fullSrc);
        }
      }

      // Also look for direct image links in gallery
      const galleryLinks = root.querySelectorAll("a[href*='wp-content/uploads']");
      for (const link of galleryLinks) {
        const href = link.getAttribute("href");
        if (href && (href.endsWith(".jpg") || href.endsWith(".png") || href.endsWith(".jpeg")) && !imageUrls.includes(href)) {
          imageUrls.push(href);
        }
      }

      // Extract full description
      const descriptionEl = root.querySelector(
        ".property-description, .description, .rh_content, " +
        "#property-description, .property-content, .entry-content"
      );
      let fullDescription = descriptionEl?.textContent?.trim() || null;

      // If no description found, try looking for text after "Descrizione"
      if (!fullDescription) {
        const allText = html.match(/Descrizione[^<]*<[^>]*>([^<]+)/i);
        if (allText) {
          fullDescription = allText[1].trim();
        }
      }

      // Clean up description - normalize whitespace
      if (fullDescription) {
        fullDescription = fullDescription.replace(/\s+/g, ' ').trim();
      }

      // Extract address from property-address element
      const addressEl = root.querySelector("p.property-address, .property-address");
      let address = addressEl?.textContent?.replace(/^\s*map-marker\s*/i, "").trim() || null;

      // If no address element, try to extract from meta or structured data
      if (!address) {
        const metaAddress = root.querySelector('meta[property="og:street-address"]');
        address = metaAddress?.getAttribute("content") || null;
      }

      // Extract features from page content
      const pageText = html.toLowerCase();
      const hasGarden = pageText.includes("giardino") && !pageText.includes("senza giardino");
      const hasTerrace = pageText.includes("terrazza") || pageText.includes("terrazzo");
      const hasBalcony = pageText.includes("balcon");
      const hasParking = pageText.includes("parcheggio") || pageText.includes("posto auto");
      const hasGarage = pageText.includes("garage") || pageText.includes("box auto");

      return {
        imageUrls,
        fullDescription,
        address,
        hasGarden,
        hasTerrace,
        hasBalcony,
        hasParking,
        hasGarage,
      };
    } catch (error) {
      this.logError(`Error fetching detail page: ${url}`, error);
      return defaultData;
    }
  }

  /**
   * Normalize raw listings into PropertyInsert format
   */
  private async normalizeListingsWithDetails(
    rawListings: RawListing[],
    regionId: string,
    sourceId: string
  ): Promise<PropertyInsert[]> {
    const properties: PropertyInsert[] = [];

    for (let i = 0; i < rawListings.length; i++) {
      const raw = rawListings[i];
      const price = this.parsePrice(raw.priceText);

      if (price === null || price < 1000) {
        this.log(`Skipping listing without valid price: ${raw.title}`);
        continue;
      }

      // Fetch detail page
      this.log(`  [${i + 1}/${rawListings.length}] Fetching details: ${raw.city} - ${raw.title.slice(0, 40)}...`);

      await this.delay();
      const detailData = await this.fetchDetailPage(raw.url);

      // Use detail page images if available, otherwise fall back to thumbnail
      const imageUrls = detailData.imageUrls.length > 0
        ? detailData.imageUrls
        : (raw.imageUrl ? [raw.imageUrl] : []);

      this.log(`    Found ${imageUrls.length} images`);

      // Extract date from WordPress upload paths (month-level precision)
      const sourceUpdatedAt = this.extractDateFromImagePaths(imageUrls);

      // Translate description to English
      this.log(`    Translating description...`);
      const descriptionEn = await this.translateDescription(detailData.fullDescription);

      // Extract living area: prefer description-based (actual living area) over listed total
      const listedArea = this.parseNumeric(raw.sqmText);
      const livingAreaFromDesc = this.extractLivingAreaFromDescription(detailData.fullDescription);
      const livingArea = livingAreaFromDesc ?? listedArea;

      if (livingAreaFromDesc && listedArea && livingAreaFromDesc < listedArea) {
        this.log(`    Living area: ${livingAreaFromDesc} mq (from description, listed: ${listedArea} mq)`);
      }

      const property: PropertyInsert = {
        region_id: regionId,
        source_id: sourceId,
        city: raw.city,
        address: raw.address,  // Full address from listing card
        price_eur: price,
        bedrooms: this.parseNumeric(raw.bedroomsText),
        bathrooms: this.parseNumeric(raw.bathroomsText),
        living_area_sqm: livingArea,
        property_type: this.inferPropertyType(raw.title, raw.propertyType),
        image_urls: imageUrls,
        description_it: detailData.fullDescription || null,
        description_en: descriptionEn,
        listing_url: raw.url,
        has_garden: detailData.hasGarden || null,
        has_terrace: detailData.hasTerrace || null,
        has_balcony: detailData.hasBalcony || null,
        has_parking: detailData.hasParking || detailData.hasGarage || null,
        has_garage: detailData.hasGarage || (this.parseNumeric(raw.garageText) ? true : null),
        source_updated_at: sourceUpdatedAt,
      };

      properties.push(property);
    }

    return properties;
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

    try {
      const html = await this.fetchPage(listingsUrl);
      const rawListings = this.extractListings(html);
      this.log(`Found ${rawListings.length} raw listings`);

      if (rawListings.length === 0) {
        this.log("No listings found. The page structure may have changed.");
        return [];
      }

      // Fetch detail pages and normalize
      this.log(`\nFetching detail pages...`);
      const properties = await this.normalizeListingsWithDetails(rawListings, regionId, sourceId);
      this.log(`\nNormalized properties: ${properties.length}`);

      return properties;
    } catch (error) {
      this.logError("Error during scraping", error);
      return [];
    }
  }
}

/**
 * Factory function to create a Casa Amola scraper instance
 */
export function createCasaAmolaScraper(): CasaAmolaScraper {
  return new CasaAmolaScraper();
}
