/**
 * Property Enrichment Script
 *
 * Runs AI-powered feature extraction on existing properties in the database.
 * Extracts features like sea view, garden, pool, etc. from Italian descriptions.
 *
 * Usage: npx tsx scripts/enrich-properties.ts [--dry-run] [--limit N]
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { query, queryAll, closePool } from "../db/connection";
import {
  extractFeaturesFromDescription,
  getFeatureSummary,
  ExtractedFeatures,
} from "../lib/ai-enrichment";

interface PropertyRow {
  id: string;
  city: string;
  description_it: string | null;
  has_sea_view: boolean | null;
  has_garden: boolean | null;
}

async function enrichProperties(options: {
  dryRun: boolean;
  limit?: number;
}) {
  console.log("🔍 Starting property enrichment...\n");

  if (options.dryRun) {
    console.log("📋 DRY RUN MODE - No changes will be saved\n");
  }

  // Fetch properties that haven't been fully enriched
  // (where key features are still null)
  let sql = `
    SELECT id, city, description_it, has_sea_view, has_garden
    FROM properties
    WHERE description_it IS NOT NULL
      AND description_it != ''
    ORDER BY created_at DESC
  `;

  if (options.limit) {
    sql += ` LIMIT ${options.limit}`;
  }

  const properties = await queryAll<PropertyRow>(sql);
  console.log(`📦 Found ${properties.length} properties to analyze\n`);

  let enrichedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const property of properties) {
    try {
      // Extract features from description
      const extracted = extractFeaturesFromDescription(property.description_it);
      const summary = getFeatureSummary(extracted);

      // Check if we found any features
      const hasNewFeatures = summary.length > 0;

      if (!hasNewFeatures) {
        skippedCount++;
        continue;
      }

      console.log(`\n🏠 ${property.city} (${property.id.slice(0, 8)}...)`);
      console.log(`   Features: ${summary.join(", ") || "None detected"}`);

      if (!options.dryRun) {
        // Update the property with extracted features
        await updatePropertyFeatures(property.id, extracted);
        console.log(`   ✅ Updated`);
      } else {
        console.log(`   📋 Would update (dry run)`);
      }

      enrichedCount++;
    } catch (error) {
      console.error(`   ❌ Error processing ${property.id}:`, error);
      errorCount++;
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log("📊 Enrichment Summary:");
  console.log(`   ✅ Enriched: ${enrichedCount}`);
  console.log(`   ⏭️  Skipped (no features found): ${skippedCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log("=".repeat(50) + "\n");
}

async function updatePropertyFeatures(
  propertyId: string,
  features: ExtractedFeatures
) {
  const updateFields: string[] = [];
  const values: (boolean | number | string | null)[] = [];
  let paramIndex = 1;

  // Build dynamic update query for non-null features
  const featureColumns: (keyof ExtractedFeatures)[] = [
    "has_sea_view",
    "has_garden",
    "has_pool",
    "has_terrace",
    "has_balcony",
    "has_parking",
    "has_garage",
    "has_fireplace",
    "has_air_conditioning",
    "has_elevator",
    "is_renovated",
    "has_mountain_view",
    "has_panoramic_view",
    "floor_number",
    "year_built",
    "energy_class",
  ];

  for (const column of featureColumns) {
    const value = features[column];
    if (value !== null) {
      updateFields.push(`${column} = $${paramIndex}`);
      values.push(value as boolean | number | string);
      paramIndex++;
    }
  }

  if (updateFields.length === 0) return;

  // Add updated_at
  updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

  // Add property ID as last parameter
  values.push(propertyId);

  const sql = `
    UPDATE properties
    SET ${updateFields.join(", ")}
    WHERE id = $${paramIndex}
  `;

  await query(sql, values);
}

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const limitIndex = args.indexOf("--limit");
const limit = limitIndex !== -1 ? parseInt(args[limitIndex + 1], 10) : undefined;

// Run the enrichment
enrichProperties({ dryRun, limit })
  .then(() => {
    console.log("✨ Enrichment complete!");
    return closePool();
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
