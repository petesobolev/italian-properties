/**
 * Translate Missing Titles and Descriptions
 *
 * Uses Google Cloud Translation API v2 (Basic) with NMT model.
 * This is the cost-effective option (~$20 per 1M characters).
 *
 * This script translates:
 * 1. All Italian titles to English (updates title field in place)
 * 2. All Italian descriptions that are missing English translations
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { queryAll, query, closePool } from "@/db";

interface PropertyToTranslate {
  id: string;
  title: string | null;
  description_it: string | null;
  description_en: string | null;
}

/**
 * Translate text using Google Cloud Translation API v2 (Basic/NMT)
 */
async function translateText(text: string): Promise<string | null> {
  const apiKey = process.env.GOOGLE_CLOUD_API_KEY;
  if (!apiKey) {
    console.error("GOOGLE_CLOUD_API_KEY not set");
    return null;
  }

  try {
    const response = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          q: text,
          source: "it",
          target: "en",
          format: "text",
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error(`  ⚠ API error: ${error.slice(0, 100)}`);
      return null;
    }

    const data = await response.json();
    return data.data?.translations?.[0]?.translatedText || null;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`  ⚠ Translation error: ${errorMessage.slice(0, 50)}`);
    return null;
  }
}

async function main() {
  console.log("=".repeat(60));
  console.log("TRANSLATING MISSING TITLES AND DESCRIPTIONS");
  console.log("Using Google Cloud Translation API v2 (NMT)");
  console.log("=".repeat(60));

  // Get all properties that need translation
  const properties = await queryAll<PropertyToTranslate>(`
    SELECT id, title, description_it, description_en
    FROM properties
    WHERE (title IS NOT NULL AND title != '')
       OR (description_it IS NOT NULL AND description_en IS NULL)
    ORDER BY updated_at DESC
  `);

  // Count translations needed
  let translationsNeeded = 0;
  for (const prop of properties) {
    if (prop.title) translationsNeeded++;
    if (prop.description_it && !prop.description_en) translationsNeeded++;
  }

  console.log(`\nFound ${properties.length} properties to process`);
  console.log(`Translations needed: ${translationsNeeded}\n`);

  let titlesTranslated = 0;
  let descriptionsTranslated = 0;
  let errors = 0;

  for (let i = 0; i < properties.length; i++) {
    const prop = properties[i];
    console.log(`[${i + 1}/${properties.length}] Processing property ${prop.id.slice(0, 8)}...`);

    let titleEn: string | null = null;
    let descriptionEn: string | null = prop.description_en;

    // Translate title if exists
    if (prop.title) {
      console.log(`  Translating title: "${prop.title.slice(0, 50)}..."`);
      titleEn = await translateText(prop.title);
      if (titleEn) {
        titlesTranslated++;
        console.log(`  → "${titleEn.slice(0, 50)}..."`);
      } else {
        errors++;
      }
    }

    // Translate description if missing English version
    if (prop.description_it && !prop.description_en) {
      console.log(`  Translating description (${prop.description_it.length} chars)...`);
      descriptionEn = await translateText(prop.description_it);
      if (descriptionEn) {
        descriptionsTranslated++;
        console.log(`  → Done (${descriptionEn.length} chars)`);
      } else {
        errors++;
      }
    }

    // Update database
    if (titleEn || (descriptionEn && !prop.description_en)) {
      await query(
        `UPDATE properties SET
          title = COALESCE($1, title),
          description_en = COALESCE($2, description_en),
          updated_at = NOW()
        WHERE id = $3`,
        [titleEn, descriptionEn, prop.id]
      );
    }

    // Small delay to avoid hitting rate limits (100 requests/second limit is generous)
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log("\n" + "=".repeat(60));
  console.log("TRANSLATION COMPLETE");
  console.log("=".repeat(60));
  console.log(`Titles translated: ${titlesTranslated}`);
  console.log(`Descriptions translated: ${descriptionsTranslated}`);
  console.log(`Errors: ${errors}`);
}

main()
  .catch(console.error)
  .finally(() => closePool());
