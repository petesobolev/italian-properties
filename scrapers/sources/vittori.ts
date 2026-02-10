/**
 * Vittori Servizi Immobiliari Scraper
 *
 * Scrapes property listings from https://www.vittoriserviziimmobiliari.it
 * This agency covers the Tuscany region, primarily around Siena province.
 *
 * Features:
 * - Fetches all pages from the listing grid
 * - Visits each property detail page to extract full image gallery
 * - Extracts additional features (garden, terrace, etc.) from detail pages
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
  description: string;
  sqmText: string | null;
  bedroomsText: string | null;
  bathroomsText: string | null;
}

/**
 * Detail page data extracted from property page
 */
interface DetailPageData {
  imageUrls: string[];
  hasGarden: boolean;
  hasTerrace: boolean;
  hasBalcony: boolean;
  hasParking: boolean;
  hasGarage: boolean;
  fullDescription: string | null;
}

/**
 * Vittori Servizi Immobiliari scraper implementation
 */
export class VittoriScraper extends BaseScraper {
  readonly config: ScraperSourceConfig = SOURCES.vittori;

  // Use order_by=insert_ts_desc to sort by "Più recente" (most recent)
  private readonly listingsPath = "/it/immobili-in-vendita?order_by=insert_ts_desc";

  /**
   * Generate timestamps that preserve scrape order
   *
   * We request listings sorted by "Più recente" (most recent) via the
   * order_by=insert_ts_desc parameter. Since the website doesn't expose
   * actual timestamps in the HTML, we preserve this recency order by
   * assigning timestamps based on scrape position:
   * - First property (most recent on source) gets current time
   * - Each subsequent property gets a timestamp 1 minute earlier
   *
   * This ensures properties maintain their relative recency from the source.
   */
  private generateOrderedTimestamp(index: number): Date {
    const now = new Date();
    // Subtract index minutes from current time
    return new Date(now.getTime() - index * 60 * 1000);
  }

  /**
   * Extract city name from listing title
   * Format: "Lucignano (AR), Villetta a schiera..." -> "Lucignano"
   */
  private extractCity(title: string): string {
    const match = title.match(/^([^(]+)\s*\(/);
    if (match) {
      return match[1].trim();
    }
    const commaIndex = title.indexOf(",");
    if (commaIndex > 0) {
      return title.substring(0, commaIndex).trim();
    }
    return title.trim();
  }

  /**
   * Infer property type from Italian title
   */
  private inferPropertyType(title: string): PropertyType {
    const lowerTitle = title.toLowerCase();

    if (lowerTitle.includes("appartament")) return "apartment";
    if (lowerTitle.includes("villa")) return "villa";
    if (lowerTitle.includes("rustico") || lowerTitle.includes("casale") || lowerTitle.includes("podere")) return "farmhouse";
    if (lowerTitle.includes("schiera") || lowerTitle.includes("bifamiliare")) return "townhouse";
    if (lowerTitle.includes("attico") || lowerTitle.includes("mansard")) return "penthouse";
    if (lowerTitle.includes("monolocale") || lowerTitle.includes("studio")) return "studio";
    if (lowerTitle.includes("terreno")) return "land";
    if (lowerTitle.includes("commerciale") || lowerTitle.includes("negozio") || lowerTitle.includes("ufficio") || lowerTitle.includes("magazzino") || lowerTitle.includes("fondo")) return "commercial";
    if (lowerTitle.includes("casa singola") || lowerTitle.includes("villetta")) return "villa";

    return "other";
  }

  /**
   * Extract listings from a single page of HTML
   */
  private extractListings(html: string): RawListing[] {
    const root = this.parseHtml(html);
    const listings: RawListing[] = [];
    const propertyCards = root.querySelectorAll(".property-container");

    for (const card of propertyCards) {
      try {
        // Extract title and URL
        const titleLink = card.querySelector(".property-text h3 a");
        if (!titleLink) continue;

        const title = titleLink.getAttribute("title") || titleLink.textContent.trim();
        const relativeUrl = titleLink.getAttribute("href");
        if (!relativeUrl) continue;

        const url = `${this.config.baseUrl}${relativeUrl}`;

        // Extract image URL (thumbnail for now, will be replaced by detail page images)
        const imageDiv = card.querySelector(".image-wrapper");
        let imageUrl: string | null = null;
        if (imageDiv) {
          const style = imageDiv.getAttribute("style") || "";
          const imageMatch = style.match(/url\(([^)]+)\)/);
          if (imageMatch) {
            imageUrl = imageMatch[1].replace(/['"]/g, "");
          }
        }

        // Extract price
        const priceSpan = card.querySelector(".property-text h4 span");
        const priceText = priceSpan?.textContent || "";

        // Extract description
        const descP = card.querySelector(".property-text p.line-clamp");
        const description = descP?.textContent.trim() || "";

        // Extract features
        const features = card.querySelectorAll(".property-features span");
        let sqmText: string | null = null;
        let bedroomsText: string | null = null;
        let bathroomsText: string | null = null;

        for (const feature of features) {
          const featureHtml = feature.innerHTML;
          const text = feature.textContent.replace(/\s+/g, " ").trim();
          const numMatch = text.match(/(\d+)/);
          const numStr = numMatch ? numMatch[1] : null;

          if (featureHtml.includes("fa-ruler-combined")) {
            sqmText = numStr;
          } else if (featureHtml.includes("fa-bed")) {
            bedroomsText = numStr;
          } else if (featureHtml.includes("fa-bath")) {
            bathroomsText = numStr;
          }
        }

        listings.push({
          title,
          url,
          imageUrl,
          priceText,
          description,
          sqmText,
          bedroomsText,
          bathroomsText,
        });
      } catch (error) {
        this.logError("Error parsing listing card", error);
      }
    }

    return listings;
  }

  /**
   * Fetch and parse a property detail page to extract full gallery and features
   */
  private async fetchDetailPage(url: string): Promise<DetailPageData> {
    const defaultData: DetailPageData = {
      imageUrls: [],
      hasGarden: false,
      hasTerrace: false,
      hasBalcony: false,
      hasParking: false,
      hasGarage: false,
      fullDescription: null,
    };

    try {
      const html = await this.fetchPage(url);
      const root = this.parseHtml(html);

      // Extract all images from the royal slider gallery
      const imageLinks = root.querySelectorAll("#slider-property .rsImg, .royalSlider .rsImg");
      const imageUrls: string[] = [];

      for (const link of imageLinks) {
        // Try data-rsBigImg first (full size), then href
        const imageUrl = link.getAttribute("data-rsBigImg") || link.getAttribute("href");
        if (imageUrl && imageUrl.includes("gestionaleimmobiliare.it")) {
          imageUrls.push(imageUrl);
        }
      }

      // If no slider images found, try extracting from background-image styles
      if (imageUrls.length === 0) {
        const allImages = html.match(/https:\/\/images\.gestionaleimmobiliare\.it\/foto\/annunci\/[^"'\s)]+/g);
        if (allImages) {
          // Filter to 1280x1280 images and dedupe
          const uniqueImages = [...new Set(allImages.filter(img => img.includes("1280x1280")))];
          imageUrls.push(...uniqueImages);
        }
      }

      // Extract features from the page content
      const pageText = html.toLowerCase();
      const hasGarden = pageText.includes("giardino") && !pageText.includes("senza giardino");
      const hasTerrace = pageText.includes("terrazza") || pageText.includes("terrazzo");
      const hasBalcony = pageText.includes("balcon");
      const hasParking = pageText.includes("parcheggio") || pageText.includes("posto auto");
      const hasGarage = pageText.includes("garage") || pageText.includes("box auto");

      // Extract full description from detail page
      // The full description is in the .description-wrapper element
      const descriptionEl = root.querySelector(".description-wrapper");
      const fullDescription = descriptionEl?.textContent.trim().replace(/\s+/g, ' ') || null;

      return {
        imageUrls,
        hasGarden,
        hasTerrace,
        hasBalcony,
        hasParking,
        hasGarage,
        fullDescription,
      };
    } catch (error) {
      this.logError(`Error fetching detail page: ${url}`, error);
      return defaultData;
    }
  }

  /**
   * Get the maximum page number from pagination links
   */
  private getMaxPageNumber(html: string): number {
    const root = this.parseHtml(html);
    const paginationLinks = root.querySelectorAll(".pagination a");
    let maxPage = 1;

    for (const link of paginationLinks) {
      const href = link.getAttribute("href") || "";
      const pageMatch = href.match(/page=(\d+)/);
      if (pageMatch) {
        const pageNum = parseInt(pageMatch[1], 10);
        if (pageNum > maxPage) {
          maxPage = pageNum;
        }
      }
    }

    return maxPage;
  }

  /**
   * Build URL for a specific page
   * Appends page parameter while preserving the order_by sort parameter
   */
  private buildPageUrl(pageNum: number): string {
    const baseListingsUrl = `${this.config.baseUrl}${this.listingsPath}`;
    if (pageNum === 1) {
      return baseListingsUrl;
    }
    // listingsPath already has ?order_by=..., so use & for additional params
    return `${baseListingsUrl}&page=${pageNum}`;
  }

  /**
   * Normalize raw listings into PropertyInsert format
   * Now includes detail page data with full image galleries
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

      if (price === null) {
        this.log(`Skipping listing without valid price: ${raw.title}`);
        continue;
      }

      // Fetch detail page for full gallery and features
      this.log(`  [${i + 1}/${rawListings.length}] Fetching details: ${this.extractCity(raw.title)}`);

      await this.delay();
      const detailData = await this.fetchDetailPage(raw.url);

      // Use detail page images if available, otherwise fall back to thumbnail
      const imageUrls = detailData.imageUrls.length > 0
        ? detailData.imageUrls
        : (raw.imageUrl ? [raw.imageUrl] : []);

      this.log(`    Found ${imageUrls.length} images`);

      // Generate timestamp based on scrape order to preserve website's recency order
      const sourceUpdatedAt = this.generateOrderedTimestamp(i);

      // Translate description to English
      const descriptionIt = detailData.fullDescription || raw.description || null;
      this.log(`    Translating description...`);
      const descriptionEn = await this.translateDescription(descriptionIt);

      const property: PropertyInsert = {
        region_id: regionId,
        source_id: sourceId,
        city: this.extractCity(raw.title),
        price_eur: price,
        bedrooms: this.parseNumeric(raw.bedroomsText),
        bathrooms: this.parseNumeric(raw.bathroomsText),
        living_area_sqm: this.parseNumeric(raw.sqmText),
        property_type: this.inferPropertyType(raw.title),
        image_urls: imageUrls,
        description_it: descriptionIt,
        description_en: descriptionEn,
        listing_url: raw.url,
        // Add extracted features
        has_garden: detailData.hasGarden || null,
        has_terrace: detailData.hasTerrace || null,
        has_balcony: detailData.hasBalcony || null,
        has_parking: detailData.hasParking || null,
        has_garage: detailData.hasGarage || null,
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

    const allListings: RawListing[] = [];
    const maxPages = this.config.maxPages || 20;

    // Fetch page 1 to determine total pages
    const firstPageUrl = this.buildPageUrl(1);
    this.log(`Fetching page 1: ${firstPageUrl}`);

    try {
      const firstPageHtml = await this.fetchPage(firstPageUrl);
      const firstPageListings = this.extractListings(firstPageHtml);
      this.log(`  Found ${firstPageListings.length} listings on page 1`);
      allListings.push(...firstPageListings);

      // Determine total pages
      const totalPages = Math.min(this.getMaxPageNumber(firstPageHtml), maxPages);
      this.log(`  Total pages to scrape: ${totalPages}`);

      // Fetch remaining pages
      for (let page = 2; page <= totalPages; page++) {
        await this.delay();

        const pageUrl = this.buildPageUrl(page);
        this.log(`Fetching page ${page}: ${pageUrl}`);

        try {
          const html = await this.fetchPage(pageUrl);
          const pageListings = this.extractListings(html);
          this.log(`  Found ${pageListings.length} listings on page ${page}`);
          allListings.push(...pageListings);

          if (pageListings.length === 0) {
            this.log("  Empty page, stopping pagination");
            break;
          }
        } catch (error) {
          this.logError(`Error fetching page ${page}`, error);
          break;
        }
      }
    } catch (error) {
      this.logError("Error fetching page 1", error);
      return [];
    }

    this.log(`Total raw listings collected: ${allListings.length}`);
    this.log(`\nFetching detail pages for full image galleries...`);

    // Normalize with detail page fetching
    const properties = await this.normalizeListingsWithDetails(allListings, regionId, sourceId);
    this.log(`\nNormalized properties: ${properties.length}`);

    return properties;
  }
}

/**
 * Factory function to create a Vittori scraper instance
 */
export function createVittoriScraper(): VittoriScraper {
  return new VittoriScraper();
}
