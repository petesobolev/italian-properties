/**
 * Translate Missing Titles and Descriptions (Overnight Version)
 *
 * This script translates:
 * 1. All Italian titles to English (stored in title field, replacing Italian)
 * 2. All Italian descriptions that are missing English translations
 *
 * Uses 45-second delays between translations to avoid rate limiting.
 * Designed to run overnight for ~400+ properties.
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { queryAll, query, closePool } from "@/db";
import { translate } from "@vitalets/google-translate-api";

interface PropertyToTranslate {
  id: string;
  title: string | null;
  description_it: string | null;
  description_en: string | null;
}

let lastTranslationTime = 0;

async function translateText(text: string, retryCount = 0): Promise<string | null> {
  try {
    // Ensure at least 45 seconds between translations for overnight running
    const timeSinceLastTranslation = Date.now() - lastTranslationTime;
    const delayNeeded = Math.max(0, 45000 - timeSinceLastTranslation);
    if (delayNeeded > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayNeeded));
    }

    lastTranslationTime = Date.now();

    const result = await translate(text, {
      from: "it",
      to: "en",
    });

    return result.text;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("Too Many Requests") && retryCount < 3) {
      const waitTime = 180000 * (retryCount + 1); // 3 min, 6 min, 9 min
      console.log(`  ⚠ Rate limited - waiting ${waitTime / 1000}s (retry ${retryCount + 1}/3)...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      return translateText(text, retryCount + 1);
    }
    console.log(`  ⚠ Translation error: ${errorMessage.slice(0, 50)}`);
    return null;
  }
}

async function main() {
  console.log("=".repeat(60));
  console.log("TRANSLATING MISSING TITLES AND DESCRIPTIONS");
  console.log("=".repeat(60));

  // Get all properties that need translation
  const properties = await queryAll<PropertyToTranslate>(`
    SELECT id, title, description_it, description_en
    FROM properties
    WHERE (title IS NOT NULL AND title != '')
       OR (description_it IS NOT NULL AND description_en IS NULL)
    ORDER BY updated_at DESC
  `);

  // Count how many translations needed
  let translationsNeeded = 0;
  for (const prop of properties) {
    if (prop.title) translationsNeeded++;
    if (prop.description_it && !prop.description_en) translationsNeeded++;
  }

  const estimatedMinutes = Math.ceil((translationsNeeded * 45) / 60);
  const estimatedHours = (estimatedMinutes / 60).toFixed(1);

  console.log(`\nFound ${properties.length} properties to process`);
  console.log(`Translations needed: ${translationsNeeded}`);
  console.log(`Estimated time: ~${estimatedMinutes} minutes (~${estimatedHours} hours)\n`);

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
      console.log(`  Translating description...`);
      descriptionEn = await translateText(prop.description_it);
      if (descriptionEn) {
        descriptionsTranslated++;
        console.log(`  → Done (${descriptionEn.length} chars)`);
      } else {
        errors++;
      }
    }

    // Update database - store translated title in title field (replacing Italian)
    // and update description_en
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
