/**
 * Base Scraper Class
 *
 * Provides common functionality for all scrapers:
 * - HTTP fetching with legacy SSL support
 * - Rate limiting between requests
 * - Error handling and logging
 *
 * Architecture notes:
 * - Scrapers extend this class and implement the abstract methods
 * - Legacy SSL support is enabled by default (many Italian sites use older configs)
 * - Request delays are enforced to be respectful to source websites
 */

import https from "https";
import { parse, HTMLElement } from "node-html-parser";
import { translate } from "@vitalets/google-translate-api";
import { Scraper, ScraperSourceConfig } from "../types";
import { PropertyInsert } from "@/types";

/**
 * Default User-Agent to mimic a real browser
 */
const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

/**
 * Abstract base class for all scrapers
 */
export abstract class BaseScraper implements Scraper {
  abstract readonly config: ScraperSourceConfig;

  /**
   * Fetch a page with legacy SSL support
   * Handles older Italian websites with weak DH keys
   */
  protected async fetchPage(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);

      const options: https.RequestOptions = {
        hostname: parsedUrl.hostname,
        path: parsedUrl.pathname + parsedUrl.search,
        method: "GET",
        headers: {
          "User-Agent": DEFAULT_USER_AGENT,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "it-IT,it;q=0.9,en;q=0.8",
        },
        rejectUnauthorized: false,
        // Allow weaker ciphers for legacy SSL configurations
        ciphers: "DEFAULT:@SECLEVEL=1",
      };

      const req = https.request(options, (res) => {
        // Handle redirects
        if (res.statusCode === 301 || res.statusCode === 302) {
          const redirectUrl = res.headers.location;
          if (redirectUrl) {
            const fullUrl = redirectUrl.startsWith("http")
              ? redirectUrl
              : `${parsedUrl.protocol}//${parsedUrl.host}${redirectUrl}`;
            this.fetchPage(fullUrl).then(resolve).catch(reject);
            return;
          }
        }

        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
          return;
        }

        let data = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve(data));
      });

      req.on("error", reject);
      req.end();
    });
  }

  /**
   * Parse HTML string into a DOM tree
   */
  protected parseHtml(html: string): HTMLElement {
    return parse(html);
  }

  /**
   * Wait for the configured delay between requests
   */
  protected async delay(): Promise<void> {
    const ms = this.config.requestDelayMs || 1000;
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Parse European price format (e.g., "179.000 €" -> 179000)
   */
  protected parsePrice(priceText: string): number | null {
    const cleaned = priceText.replace(/[€\s]/g, "").trim();
    const numericString = cleaned.replace(/\./g, "");
    const price = parseInt(numericString, 10);
    return isNaN(price) ? null : price;
  }

  /**
   * Parse a numeric string (e.g., "120" -> 120)
   */
  protected parseNumeric(text: string | null): number | null {
    if (!text) return null;
    const num = parseInt(text.trim(), 10);
    return isNaN(num) ? null : num;
  }

  /**
   * Log a message with the source name prefix
   */
  protected log(message: string): void {
    console.log(`[${this.config.name}] ${message}`);
  }

  /**
   * Log an error with the source name prefix
   */
  protected logError(message: string, error?: unknown): void {
    console.error(`[${this.config.name}] ERROR: ${message}`, error || "");
  }

  /**
   * Translate Italian text to English
   *
   * Uses a longer delay (2.5s) between translations to avoid rate limiting.
   * Returns null if translation fails (the Italian text is still preserved).
   *
   * @param italianText - The Italian text to translate
   * @returns The English translation, or null if translation fails/skipped
   */
  protected async translateDescription(
    italianText: string | null | undefined
  ): Promise<string | null> {
    if (!italianText || italianText.trim().length === 0) {
      return null;
    }

    try {
      // Add a longer delay before translation to avoid rate limiting
      // Using 5 seconds to be conservative with the free API
      await new Promise((resolve) => setTimeout(resolve, 5000));

      const result = await translate(italianText, {
        from: "it",
        to: "en",
      });

      return result.text;
    } catch (error) {
      // Log but don't fail - we still have the Italian text
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("Too Many Requests")) {
        this.log("    ⚠ Translation rate limited - skipping");
      } else {
        this.log(`    ⚠ Translation failed: ${errorMessage.slice(0, 50)}`);
      }
      return null;
    }
  }

  /**
   * Main scrape method - must be implemented by subclasses
   */
  abstract scrape(
    regionId: string,
    sourceId: string,
    regionSlug: string
  ): Promise<PropertyInsert[]>;
}
