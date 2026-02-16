/**
 * Demo Property Page
 *
 * Shows the property detail page with mock data for UI preview.
 * This page can be removed once the database is set up.
 */

import Link from "next/link";
import { ImageGallery } from "@/components/ImageGallery";
import { PropertyFeatures } from "@/components/PropertyFeatures";

// Mock property data for demo
const mockProperty = {
  id: "demo-123",
  city: "San Gimignano",
  region_slug: "tuscany",
  region_name: "Tuscany",
  price_eur: 385000,
  bedrooms: 3,
  bathrooms: 2,
  living_area_sqm: 145,
  property_type: "farmhouse",
  // Features extracted by AI enrichment
  has_sea_view: false,
  has_garden: true,
  has_pool: false,
  has_terrace: true,
  has_balcony: false,
  has_parking: true,
  has_garage: true,
  has_fireplace: true,
  has_air_conditioning: true,
  has_elevator: false,
  is_renovated: true,
  has_mountain_view: false,
  has_panoramic_view: true,
  floor_number: null,  // Not applicable for farmhouse
  year_built: 1920,
  energy_class: "D",
  source_name: "Vittori Servizi Immobiliari",
  listing_url: "https://www.vittoriserviziimmobiliari.it",
  description_it: `Splendido casale ristrutturato situato nelle colline toscane, a pochi minuti dal centro storico di San Gimignano.

La proprietà si sviluppa su due livelli e comprende un ampio soggiorno con camino, cucina abitabile con accesso diretto al giardino, tre camere da letto e due bagni.

Caratteristiche principali:
• Travi a vista originali
• Pavimenti in cotto toscano
• Riscaldamento autonomo
• Giardino privato di 800 mq con olivi
• Posto auto coperto

La posizione panoramica offre una vista mozzafiato sulle colline circostanti e sulle famose torri medievali di San Gimignano. Ideale come residenza principale o come casa vacanze.`,
  image_urls: [
    "https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=1200&h=800&fit=crop",
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&h=800&fit=crop",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&h=800&fit=crop",
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&h=800&fit=crop",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&h=800&fit=crop",
  ],
};

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

const propertyTypeLabels: Record<string, string> = {
  apartment: "Appartamento",
  villa: "Villa",
  farmhouse: "Casale",
  townhouse: "Casa a Schiera",
  penthouse: "Attico",
};

export default function DemoPropertyPage() {
  const property = mockProperty;
  const typeLabel = propertyTypeLabels[property.property_type] || "Proprietà";

  return (
    <div className="min-h-screen bg-[var(--color-stone)]">
      {/* Demo Banner */}
      <div className="bg-[var(--color-terracotta)] text-white text-center py-2 text-sm">
        🎨 This is a demo page with sample data to preview the UI
      </div>

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
              {property.region_name}
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
              images={property.image_urls}
              alt={`${typeLabel} in ${property.city}`}
            />

            {/* Description */}
            <section className="bg-[var(--color-cream)] rounded-xl p-6 sm:p-8 border border-[var(--color-sand)]">
              <h2 className="font-display text-2xl text-[var(--color-text)] mb-4 flex items-center gap-3">
                <span className="w-8 h-0.5 bg-[var(--color-terracotta)]" />
                Descrizione
              </h2>
              <div className="prose prose-stone max-w-none">
                <p className="text-[var(--color-text-muted)] leading-relaxed whitespace-pre-line">
                  {property.description_it}
                </p>
              </div>
            </section>

            {/* Features Grid */}
            <PropertyFeatures
              bedrooms={property.bedrooms}
              bathrooms={property.bathrooms}
              livingArea={property.living_area_sqm}
              priceEur={property.price_eur}
              propertyType={property.property_type}
              hasSeaView={property.has_sea_view}
              hasGarden={property.has_garden}
              hasPool={property.has_pool}
              hasTerrace={property.has_terrace}
              hasBalcony={property.has_balcony}
              hasParking={property.has_parking}
              hasGarage={property.has_garage}
              hasFireplace={property.has_fireplace}
              hasAirConditioning={property.has_air_conditioning}
              hasElevator={property.has_elevator}
              isRenovated={property.is_renovated}
              hasMountainView={property.has_mountain_view}
              hasPanoramicView={property.has_panoramic_view}
              yearBuilt={property.year_built}
              energyClass={property.energy_class}
            />
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
                    {property.city}, {property.region_name}
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
                  <div className="text-center">
                    <div className="font-display text-2xl text-[var(--color-text)]">
                      {property.bedrooms}
                    </div>
                    <div className="text-xs text-[var(--color-text-muted)]">
                      Bedrooms
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-display text-2xl text-[var(--color-text)]">
                      {property.bathrooms}
                    </div>
                    <div className="text-xs text-[var(--color-text-muted)]">
                      Bathrooms
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-display text-2xl text-[var(--color-text)]">
                      {property.living_area_sqm}
                    </div>
                    <div className="text-xs text-[var(--color-text-muted)]">
                      m²
                    </div>
                  </div>
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
                <p className="mt-4 text-xs text-center text-[var(--color-text-light)]">
                  Listed by {property.source_name}
                </p>
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
                Back to {property.region_name} Properties
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

export const metadata = {
  title: "Demo Property | Italian Properties",
  description: "Preview of the property detail page with sample data.",
};
