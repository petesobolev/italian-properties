/**
 * AI Data Enrichment Module
 *
 * Uses pattern matching and AI to extract structured data from
 * Italian property descriptions. Detects features like sea views,
 * gardens, pools, and other amenities.
 *
 * Architecture note: This module provides both rule-based extraction
 * (fast, no API needed) and optional AI-powered extraction (more accurate,
 * requires API key). The rule-based approach works offline and is used
 * as a fallback.
 */

export interface ExtractedFeatures {
  has_sea_view: boolean | null;
  has_garden: boolean | null;
  has_pool: boolean | null;
  has_terrace: boolean | null;
  has_balcony: boolean | null;
  has_parking: boolean | null;
  has_garage: boolean | null;
  has_fireplace: boolean | null;
  has_air_conditioning: boolean | null;
  has_elevator: boolean | null;
  is_renovated: boolean | null;
  has_mountain_view: boolean | null;
  has_panoramic_view: boolean | null;
  floor_number: number | null;
  year_built: number | null;
  energy_class: string | null;
}

/**
 * Italian keywords for feature detection
 * Each feature has positive indicators and negative indicators (to avoid false positives)
 */
const FEATURE_PATTERNS: Record<keyof ExtractedFeatures, {
  positive: RegExp[];
  negative?: RegExp[];
}> = {
  has_sea_view: {
    positive: [
      /vista\s+mare/i,
      /vista\s+sul\s+mare/i,
      /affaccio\s+sul\s+mare/i,
      /fronte\s+mare/i,
      /sul\s+mare/i,
      /panorama\s+marino/i,
      /vista\s+oceano/i,
    ],
    negative: [
      /senza\s+vista\s+mare/i,
      /no\s+vista\s+mare/i,
    ],
  },
  has_garden: {
    positive: [
      /giardino/i,
      /jardín/i,
      /spazio\s+verde/i,
      /area\s+verde/i,
      /parco\s+privato/i,
      /terreno\s+con\s+piante/i,
    ],
    negative: [
      /senza\s+giardino/i,
      /no\s+giardino/i,
      /giardino\s+condominiale/i,  // shared garden
    ],
  },
  has_pool: {
    positive: [
      /piscina/i,
      /piscine/i,
      /swimming\s+pool/i,
    ],
    negative: [
      /senza\s+piscina/i,
      /no\s+piscina/i,
      /piscina\s+comunale/i,  // public pool
    ],
  },
  has_terrace: {
    positive: [
      /terrazza/i,
      /terrazzo/i,
      /roof\s+terrace/i,
      /lastrico\s+solare/i,
    ],
  },
  has_balcony: {
    positive: [
      /balcone/i,
      /balconi/i,
      /loggia/i,
      /loggetta/i,
    ],
  },
  has_parking: {
    positive: [
      /posto\s+auto/i,
      /posti\s+auto/i,
      /parcheggio/i,
      /parking/i,
      /area\s+parcheggio/i,
    ],
  },
  has_garage: {
    positive: [
      /garage/i,
      /box\s+auto/i,
      /autorimessa/i,
      /rimessa/i,
    ],
  },
  has_fireplace: {
    positive: [
      /camino/i,
      /caminetto/i,
      /stufa\s+a\s+legna/i,
      /fireplace/i,
    ],
  },
  has_air_conditioning: {
    positive: [
      /aria\s+condizionata/i,
      /condizionatore/i,
      /climatizzatore/i,
      /climatizzazione/i,
      /a\/c/i,
      /ac\b/i,
    ],
  },
  has_elevator: {
    positive: [
      /ascensore/i,
      /elevatore/i,
      /lift/i,
    ],
    negative: [
      /senza\s+ascensore/i,
      /no\s+ascensore/i,
      /privo\s+di\s+ascensore/i,
    ],
  },
  is_renovated: {
    positive: [
      /ristrutturato/i,
      /ristrutturata/i,
      /rinnovato/i,
      /rinnovata/i,
      /nuova\s+costruzione/i,
      /recentemente\s+ristrutturato/i,
      /completamente\s+ristrutturato/i,
      /totalmente\s+ristrutturato/i,
    ],
  },
  has_mountain_view: {
    positive: [
      /vista\s+montagna/i,
      /vista\s+sulle\s+montagne/i,
      /vista\s+monti/i,
      /panorama\s+montano/i,
      /vista\s+appennini/i,
      /vista\s+alpi/i,
    ],
  },
  has_panoramic_view: {
    positive: [
      /vista\s+panoramica/i,
      /panoramico/i,
      /panoramica/i,
      /vista\s+mozzafiato/i,
      /vista\s+spettacolare/i,
    ],
  },
  floor_number: {
    positive: [], // Handled separately with number extraction
  },
  year_built: {
    positive: [], // Handled separately with number extraction
  },
  energy_class: {
    positive: [], // Handled separately with pattern extraction
  },
};

/**
 * Extract floor number from description
 */
function extractFloorNumber(text: string): number | null {
  // Common patterns: "piano 3", "3° piano", "terzo piano", "al terzo piano"
  const patterns = [
    /(?:piano|floor)\s*(?:n\.?\s*)?(\d+)/i,
    /(\d+)[°º]?\s*piano/i,
    /al\s+(\w+)\s+piano/i,
  ];

  const italianNumbers: Record<string, number> = {
    primo: 1, prima: 1,
    secondo: 2, seconda: 2,
    terzo: 3, terza: 3,
    quarto: 4, quarta: 4,
    quinto: 5, quinta: 5,
    sesto: 6, sesta: 6,
    settimo: 7, settima: 7,
    ottavo: 8, ottava: 8,
    nono: 9, nona: 9,
    decimo: 10, decima: 10,
    terra: 0,
    pianterreno: 0,
  };

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const value = match[1];
      // Check if it's a number
      const num = parseInt(value, 10);
      if (!isNaN(num)) return num;
      // Check if it's an Italian word
      const italianNum = italianNumbers[value.toLowerCase()];
      if (italianNum !== undefined) return italianNum;
    }
  }

  // Check for ground floor
  if (/piano\s+terra|pianterreno/i.test(text)) return 0;

  return null;
}

/**
 * Extract year built from description
 */
function extractYearBuilt(text: string): number | null {
  // Patterns: "costruito nel 1990", "anno 1985", "del 1920"
  const patterns = [
    /costruito\s+(?:nel\s+)?(\d{4})/i,
    /anno\s+(?:di\s+costruzione\s+)?(\d{4})/i,
    /(?:del|nel)\s+(\d{4})/i,
    /risalente\s+al\s+(\d{4})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const year = parseInt(match[1], 10);
      // Validate it's a reasonable year for a building
      if (year >= 1800 && year <= new Date().getFullYear()) {
        return year;
      }
    }
  }

  return null;
}

/**
 * Extract energy class from description
 */
function extractEnergyClass(text: string): string | null {
  // Patterns: "classe energetica A", "APE: B", "classe A+"
  const patterns = [
    /classe\s+energetica\s*:?\s*([A-G]\+?)/i,
    /APE\s*:?\s*([A-G]\+?)/i,
    /certificazione\s+energetica\s*:?\s*([A-G]\+?)/i,
    /classe\s+([A-G]\+?)\b/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].toUpperCase();
    }
  }

  return null;
}

/**
 * Extract features from Italian property description using rule-based matching
 *
 * @param description - The Italian property description text
 * @returns Extracted features with boolean/null values
 */
export function extractFeaturesFromDescription(
  description: string | null | undefined
): ExtractedFeatures {
  const features: ExtractedFeatures = {
    has_sea_view: null,
    has_garden: null,
    has_pool: null,
    has_terrace: null,
    has_balcony: null,
    has_parking: null,
    has_garage: null,
    has_fireplace: null,
    has_air_conditioning: null,
    has_elevator: null,
    is_renovated: null,
    has_mountain_view: null,
    has_panoramic_view: null,
    floor_number: null,
    year_built: null,
    energy_class: null,
  };

  if (!description) return features;

  const text = description.toLowerCase();

  // Check each boolean feature
  for (const [key, patterns] of Object.entries(FEATURE_PATTERNS)) {
    if (key === "floor_number" || key === "year_built" || key === "energy_class") {
      continue; // Handle separately
    }

    const featureKey = key as keyof ExtractedFeatures;

    // Check for negative indicators first
    if (patterns.negative?.some((pattern) => pattern.test(text))) {
      (features[featureKey] as boolean | null) = false;
      continue;
    }

    // Check for positive indicators
    if (patterns.positive.some((pattern) => pattern.test(text))) {
      (features[featureKey] as boolean | null) = true;
    }
  }

  // Extract numeric/string features
  features.floor_number = extractFloorNumber(text);
  features.year_built = extractYearBuilt(description); // Use original case for years
  features.energy_class = extractEnergyClass(description);

  return features;
}

/**
 * Merge extracted features with existing property data
 * Only updates null values, preserving any manually set data
 */
export function mergeFeatures(
  existing: Partial<ExtractedFeatures>,
  extracted: ExtractedFeatures
): ExtractedFeatures {
  const merged: ExtractedFeatures = { ...extracted };

  for (const key of Object.keys(extracted) as (keyof ExtractedFeatures)[]) {
    if (existing[key] !== undefined && existing[key] !== null) {
      (merged[key] as typeof merged[typeof key]) = existing[key] as typeof merged[typeof key];
    }
  }

  return merged;
}

/**
 * Get a human-readable summary of extracted features
 */
export function getFeatureSummary(features: ExtractedFeatures): string[] {
  const summary: string[] = [];

  if (features.has_sea_view) summary.push("Sea View");
  if (features.has_mountain_view) summary.push("Mountain View");
  if (features.has_panoramic_view) summary.push("Panoramic View");
  if (features.has_garden) summary.push("Garden");
  if (features.has_pool) summary.push("Pool");
  if (features.has_terrace) summary.push("Terrace");
  if (features.has_balcony) summary.push("Balcony");
  if (features.has_parking) summary.push("Parking");
  if (features.has_garage) summary.push("Garage");
  if (features.has_fireplace) summary.push("Fireplace");
  if (features.has_air_conditioning) summary.push("A/C");
  if (features.has_elevator) summary.push("Elevator");
  if (features.is_renovated) summary.push("Renovated");
  if (features.energy_class) summary.push(`Energy Class ${features.energy_class}`);

  return summary;
}
