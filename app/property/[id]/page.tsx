/**
 * Property Detail Page
 *
 * Displays full property information with image gallery,
 * features, description, and source link.
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { getPropertyById } from "@/lib/properties";
import { translateToEnglish } from "@/lib/translate";
import { ImageGallery } from "@/components/ImageGallery";
import { PropertyFeatures } from "@/components/PropertyFeatures";
import { PropertyLocationMap } from "@/components/PropertyLocationMap";

interface PropertyPageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Format price with European/Italian formatting
 */
function formatPrice(price: number): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Format date for display (e.g., "January 15, 2025")
 */
function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
}

/**
 * Property type display names (English)
 */
const propertyTypeLabels: Record<string, string> = {
  apartment: "Apartment",
  villa: "Villa",
  farmhouse: "Farmhouse",
  townhouse: "Townhouse",
  penthouse: "Penthouse",
  studio: "Studio",
  land: "Land",
  commercial: "Commercial",
  other: "Property",
};

/**
 * Region display names
 */
const regionNames: Record<string, string> = {
  tuscany: "Tuscany",
  calabria: "Calabria",
  puglia: "Puglia",
};

export default async function PropertyPage({ params }: PropertyPageProps) {
  const { id } = await params;

  const property = await getPropertyById(id);

  if (!property) {
    notFound();
  }

  const typeLabel = propertyTypeLabels[property.property_type] || "Property";
  const regionName = regionNames[property.region_slug] || property.region_slug;

  // Use pre-translated English description, fall back to runtime translation for legacy data
  const description = property.description_en
    || await translateToEnglish(property.description_it);

  return (
    <div className="min-h-screen bg-[var(--color-stone)]">
      {/* Breadcrumb Navigation */}
      <div className="bg-[var(--color-cream)] border-b border-[var(--color-sand)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-2 text-sm">
            <Link
              href="/"
              className="text-[var(--color-text-muted)] hover:text-[var(--color-terracotta)] transition-colors"
            >
              Home
            </Link>
            <ChevronIcon />
            <Link
              href={`/${property.region_slug}`}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-terracotta)] transition-colors"
            >
              {regionName}
            </Link>
            <ChevronIcon />
            <span className="text-[var(--color-text)] font-medium truncate max-w-[200px]">
              {typeLabel} in {property.city}
            </span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Main Content - Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery */}
            <ImageGallery
              images={property.image_urls || []}
              alt={`${typeLabel} in ${property.city}`}
            />

            {/* Description */}
            {description && (
              <section className="bg-[var(--color-cream)] rounded-xl p-6 sm:p-8 border border-[var(--color-sand)]">
                <h2 className="font-display text-2xl text-[var(--color-text)] mb-4 flex items-center gap-3">
                  <span className="w-8 h-0.5 bg-[var(--color-terracotta)]" />
                  Description
                </h2>
                <div className="prose prose-stone max-w-none">
                  <p className="text-[var(--color-text-muted)] leading-relaxed whitespace-pre-line">
                    {description}
                  </p>
                </div>
              </section>
            )}

            {/* Features Grid */}
            <PropertyFeatures
              bedrooms={property.bedrooms}
              bathrooms={property.bathrooms}
              livingArea={property.living_area_sqm}
              priceEur={property.price_eur}
              propertyType={property.property_type}
              hasSeaView={property.has_sea_view}
              hasGarden={property.has_garden}
            />

            {/* Location Map - shown when address or coordinates are available */}
            {(property.latitude && property.longitude) && (
              <PropertyLocationMap
                latitude={property.latitude}
                longitude={property.longitude}
                address={property.address}
                city={property.city}
              />
            )}
          </div>

          {/* Sidebar - Right Column */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24 space-y-6">
              {/* Price Card */}
              <div
                className="bg-[var(--color-cream)] rounded-xl p-6 border border-[var(--color-sand)]"
                style={{ boxShadow: "var(--shadow-md)" }}
              >
                {/* Property Type Badge */}
                <div className="mb-4">
                  <span className="badge badge-terracotta">{typeLabel}</span>
                </div>

                {/* Location */}
                <div className="flex items-center gap-2 mb-2">
                  <svg
                    className="w-5 h-5 text-[var(--color-terracotta)]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                    />
                  </svg>
                  <h1 className="font-display text-xl text-[var(--color-text)]">
                    {property.city}, {regionName}
                  </h1>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <span className="font-display text-4xl font-semibold text-[var(--color-text)]">
                    {formatPrice(property.price_eur)}
                  </span>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4 py-4 border-y border-[var(--color-sand)]">
                  {property.bedrooms !== null && (
                    <div className="text-center">
                      <div className="font-display text-2xl text-[var(--color-text)]">
                        {property.bedrooms}
                      </div>
                      <div className="text-xs text-[var(--color-text-muted)]">
                        Bedrooms
                      </div>
                    </div>
                  )}
                  {property.bathrooms !== null && (
                    <div className="text-center">
                      <div className="font-display text-2xl text-[var(--color-text)]">
                        {property.bathrooms}
                      </div>
                      <div className="text-xs text-[var(--color-text-muted)]">
                        Bathrooms
                      </div>
                    </div>
                  )}
                  {property.living_area_sqm !== null && (
                    <div className="text-center">
                      <div className="font-display text-2xl text-[var(--color-text)]">
                        {property.living_area_sqm}
                      </div>
                      <div className="text-xs text-[var(--color-text-muted)]">
                        m²
                      </div>
                    </div>
                  )}
                </div>

                {/* View Original Listing Button */}
                <a
                  href={property.listing_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--color-terracotta)] hover:bg-[var(--color-terracotta-dark)] text-white font-medium rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
                >
                  View Original Listing
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                    />
                  </svg>
                </a>

                {/* Source Info */}
                <div className="mt-4 text-xs text-center text-[var(--color-text-light)] space-y-1">
                  <p>Listed by {property.source_name}</p>
                  <p className="flex items-center justify-center gap-1.5">
                    <svg
                      className="w-3.5 h-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Updated {formatDate(property.source_updated_at || property.updated_at)}
                  </p>
                </div>
              </div>

              {/* Back to Region Link */}
              <Link
                href={`/${property.region_slug}`}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-800 rounded-lg text-white font-medium hover:bg-[var(--color-terracotta)] hover:shadow-sm transition-all duration-200"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                  />
                </svg>
                Back to {regionName} Properties
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChevronIcon() {
  return (
    <svg
      className="w-4 h-4 text-[var(--color-text-light)]"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5l7 7-7 7"
      />
    </svg>
  );
}

/**
 * Generate metadata for SEO
 */
export async function generateMetadata({ params }: PropertyPageProps) {
  const { id } = await params;
  const property = await getPropertyById(id);

  if (!property) {
    return {
      title: "Property Not Found | Italian Properties",
    };
  }

  const typeLabel = propertyTypeLabels[property.property_type] || "Property";
  const regionName = regionNames[property.region_slug] || property.region_slug;

  return {
    title: `${typeLabel} in ${property.city}, ${regionName} | Italian Properties`,
    description: `${typeLabel} for sale in ${property.city}, ${regionName}. ${property.bedrooms || "–"} bedrooms, ${property.bathrooms || "–"} bathrooms, ${property.living_area_sqm || "–"} m². Price: €${property.price_eur.toLocaleString()}.`,
  };
}
