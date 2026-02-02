/**
 * Region Page Component
 *
 * Displays property listings for a specific Italian region.
 * Server Component that fetches data directly from the database.
 * Includes sidebar filters with URL-based state management.
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getPropertiesByRegion, getRegion } from "@/lib/properties";
import { PropertyGrid, PropertyGridHeader } from "@/components/PropertyGrid";
import { PropertyFilters } from "@/components/PropertyFilters";
import { ViewToggle } from "@/components/ViewToggle";
import { RegionMapView } from "@/components/RegionMapView";
import { PropertyFilters as PropertyFiltersType } from "@/types";

interface RegionPageProps {
  params: Promise<{
    region: string;
  }>;
  searchParams: Promise<{
    price?: string;
    beds?: string;
    baths?: string;
    type?: string;
    seaView?: string;
    garden?: string;
    view?: "grid" | "map";
    sort?: "updated" | "price_asc" | "price_desc";
  }>;
}

/**
 * Region display names and descriptions
 */
const regionInfo: Record<
  string,
  { name: string; tagline: string; description: string }
> = {
  tuscany: {
    name: "Tuscany",
    tagline: "Rolling hills & Renaissance charm",
    description:
      "From the vineyards of Chianti to the medieval towers of San Gimignano, Tuscany offers timeless Italian beauty.",
  },
  calabria: {
    name: "Calabria",
    tagline: "The toe of Italy's boot",
    description:
      "Crystal-clear waters, ancient Greek ruins, and authentic southern Italian culture await in this hidden gem.",
  },
  puglia: {
    name: "Puglia",
    tagline: "Whitewashed villages & olive groves",
    description:
      "Discover trulli houses, baroque architecture, and endless coastline in Italy's sun-drenched heel.",
  },
};

/**
 * Parse price range string (e.g., "50000-100000") into min/max values
 */
function parsePriceRange(price: string | undefined): { min?: number; max?: number } {
  if (!price) return {};

  const [minStr, maxStr] = price.split("-");
  const min = minStr ? parseInt(minStr, 10) : undefined;
  const max = maxStr ? parseInt(maxStr, 10) : undefined;

  return {
    min: !isNaN(min!) ? min : undefined,
    max: !isNaN(max!) ? max : undefined,
  };
}

export default async function RegionPage({ params, searchParams }: RegionPageProps) {
  const { region: regionSlug } = await params;
  const search = await searchParams;

  // Validate region exists in our supported regions
  const info = regionInfo[regionSlug];
  if (!info) {
    notFound();
  }

  // Parse filter values from URL search params
  const priceRange = parsePriceRange(search.price);
  const filters: PropertyFiltersType = {
    price_min: priceRange.min,
    price_max: priceRange.max,
    bedrooms_min: search.beds ? parseInt(search.beds, 10) : undefined,
    bathrooms_min: search.baths ? parseInt(search.baths, 10) : undefined,
    property_types: search.type ? [search.type as PropertyFiltersType["property_types"] extends (infer U)[] | undefined ? U : never] : undefined,
    has_sea_view: search.seaView === "true" ? true : undefined,
    has_garden: search.garden === "true" ? true : undefined,
    sort: search.sort || "updated",
  };

  // Fetch region and properties from database
  const [region, properties] = await Promise.all([
    getRegion(regionSlug),
    getPropertiesByRegion(regionSlug, filters),
  ]);

  // If region doesn't exist in database, show empty state
  // (this allows the page to work even before db:setup is run)
  const hasDatabase = region !== null;

  // Count active filters for display
  const activeFilterCount = [
    search.price,
    search.beds,
    search.baths,
    search.type,
    search.seaView,
    search.garden,
  ].filter(Boolean).length;

  // Determine current view mode
  const currentView = search.view || "grid";

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-[var(--color-text)] text-white overflow-hidden">
        {/* Background pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-white/60 mb-8">
            <Link
              href="/"
              className="hover:text-white transition-colors duration-200"
            >
              Home
            </Link>
            <svg
              className="w-4 h-4"
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
            <span className="text-white">{info.name}</span>
          </nav>

          {/* Region Header */}
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-block w-12 h-1 bg-[var(--color-terracotta)]" />
              <span className="font-display text-[var(--color-terracotta-light)] italic">
                {info.tagline}
              </span>
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-medium mb-6">
              {info.name}
            </h1>
            <p className="text-lg sm:text-xl text-white/80 leading-relaxed">
              {info.description}
            </p>
          </div>
        </div>

        {/* Decorative wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-12"
            preserveAspectRatio="none"
          >
            <path
              d="M0 48h1440V24c-120 12-240 18-360 18s-240-6-360-18-240-18-360-18-240 6-360 18v24z"
              fill="var(--color-stone)"
            />
          </svg>
        </div>
      </section>

      {/* Listings Section with Filters */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar - Always visible for UI preview */}
          <div className="lg:w-72 flex-shrink-0">
            <div className="lg:sticky lg:top-24">
              <Suspense fallback={<FiltersSkeleton />}>
                <PropertyFilters />
              </Suspense>
            </div>
          </div>

          {/* Property Grid or Setup Message */}
          <div className="flex-1 min-w-0">
            <>
              {/* Header with count and view toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <PropertyGridHeader
                  count={properties.length}
                  regionName={info.name}
                  hasFilters={activeFilterCount > 0}
                />
                <Suspense fallback={<ViewToggleSkeleton />}>
                  <ViewToggle />
                </Suspense>
              </div>

              {/* Database setup notice */}
              {!hasDatabase && (
                <div className="mb-6 p-4 bg-[var(--color-cream)] rounded-lg border border-[var(--color-sand)]">
                  <div className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-[var(--color-olive)] mt-0.5 flex-shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
                      />
                    </svg>
                    <div className="text-sm">
                      <p className="font-medium text-[var(--color-text)]">Database not connected</p>
                      <p className="text-[var(--color-text-muted)]">
                        Run <code className="px-1.5 py-0.5 bg-[var(--color-stone-dark)] rounded text-xs">npm run db:setup</code> to set up your database and see real properties.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Grid or Map View */}
              {currentView === "map" ? (
                <RegionMapView
                  properties={properties}
                  regionSlug={regionSlug}
                  regionName={info.name}
                />
              ) : (
                <PropertyGrid
                  properties={properties}
                  emptyMessage={
                    activeFilterCount > 0
                      ? `No properties match your filters in ${info.name}`
                      : `No properties in ${info.name} yet`
                  }
                />
              )}
            </>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[var(--color-cream)] border-t border-[var(--color-sand)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl text-[var(--color-text)] mb-2">
                Explore other regions
              </h2>
              <p className="text-[var(--color-text-muted)]">
                Each corner of Italy has its own unique character and charm.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {Object.entries(regionInfo)
                .filter(([slug]) => slug !== regionSlug)
                .map(([slug, { name }]) => (
                  <Link
                    key={slug}
                    href={`/${slug}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white rounded-lg text-[var(--color-text)] font-medium hover:shadow-md transition-shadow duration-200 border border-[var(--color-sand)]"
                  >
                    {name}
                    <svg
                      className="w-4 h-4 text-[var(--color-terracotta)]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/**
 * Loading skeleton for filters
 */
function FiltersSkeleton() {
  return (
    <div className="bg-[var(--color-cream)] rounded-xl border border-[var(--color-sand)] p-6 animate-pulse">
      <div className="h-6 w-20 bg-[var(--color-stone-dark)] rounded mb-6" />
      <div className="space-y-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i}>
            <div className="h-4 w-24 bg-[var(--color-stone-dark)] rounded mb-3" />
            <div className="h-10 bg-[var(--color-stone-dark)] rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Loading skeleton for view toggle
 */
function ViewToggleSkeleton() {
  return (
    <div className="inline-flex items-center gap-1 p-1 bg-white rounded-lg border border-[var(--color-sand)] animate-pulse">
      <div className="w-20 h-9 bg-[var(--color-stone-dark)] rounded-md" />
      <div className="w-20 h-9 bg-[var(--color-stone-dark)] rounded-md" />
    </div>
  );
}

/**
 * Generate metadata for SEO
 */
export async function generateMetadata({ params }: RegionPageProps) {
  const { region } = await params;
  const info = regionInfo[region];

  if (!info) {
    return {
      title: "Region Not Found | Italian Properties",
    };
  }

  return {
    title: `Properties in ${info.name} | Italian Properties`,
    description: `${info.description} Browse our selection of villas, farmhouses, and apartments in ${info.name}, Italy.`,
  };
}

/**
 * Generate static paths for supported regions
 */
export function generateStaticParams() {
  return [{ region: "tuscany" }, { region: "calabria" }, { region: "puglia" }];
}
