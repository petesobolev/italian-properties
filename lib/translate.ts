/**
 * Translation Utility
 *
 * Provides Italian to English translation for property descriptions.
 * Uses the free Google Translate API (unofficial).
 *
 * Note: For production at scale, consider using an official API
 * (Google Cloud Translation, DeepL, etc.) for better reliability.
 */

import { translate } from "@vitalets/google-translate-api";

/**
 * Simple in-memory cache for translations
 * Key: Italian text (first 100 chars as hash), Value: English translation
 */
const translationCache = new Map<string, string>();

/**
 * Create a simple cache key from the text
 */
function getCacheKey(text: string): string {
  // Use first 100 chars + length as a simple hash
  return `${text.slice(0, 100)}_${text.length}`;
}

/**
 * Translate Italian text to English
 *
 * @param italianText - The Italian text to translate
 * @returns The English translation, or the original text if translation fails
 */
export async function translateToEnglish(
  italianText: string | null | undefined
): Promise<string | null> {
  if (!italianText) return null;

  // Check cache first
  const cacheKey = getCacheKey(italianText);
  const cached = translationCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const result = await translate(italianText, {
      from: "it",
      to: "en",
    });

    const translation = result.text;

    // Cache the result
    translationCache.set(cacheKey, translation);

    return translation;
  } catch (error) {
    console.error("Translation error:", error);
    // Return original text if translation fails
    return italianText;
  }
}
