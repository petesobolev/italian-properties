/**
 * Property Card Component
 *
 * Editorial-style property listing card with Mediterranean aesthetics.
 * Features elegant typography, warm shadows, and smooth hover animations.
 */

import Image from "next/image";
import Link from "next/link";
import { PropertySummary } from "@/types";

interface PropertyCardProps {
  property: PropertySummary;
  index?: number; // For staggered animations
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
 * Format date as relative time (e.g., "3 days ago", "2 weeks ago")
 * Shows when the listing was last updated on the source website
 */
function formatRelativeDate(date: Date | string | null): string {
  if (!date) return "";

  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks !== 1 ? "s" : ""} ago`;
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} month${months !== 1 ? "s" : ""} ago`;
  }
  const years = Math.floor(diffDays / 365);
  return `${years} year${years !== 1 ? "s" : ""} ago`;
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
 * Sale status display labels and styling
 */
const saleStatusConfig: Record<string, { label: string; bgColor: string; textColor: string }> = {
  in_contract: {
    label: "In Contract",
    bgColor: "bg-amber-500",
    textColor: "text-white",
  },
  sold: {
    label: "Sold",
    bgColor: "bg-red-600",
    textColor: "text-white",
  },
};

export function PropertyCard({ property, index = 0 }: PropertyCardProps) {
  const {
    id,
    city,
    price_eur,
    bedrooms,
    bathrooms,
    living_area_sqm,
    property_type,
    thumbnail_url,
    sale_status,
    source_updated_at,
    updated_at,
    source_logo_url,
  } = property;

  const typeLabel = propertyTypeLabels[property_type] || "Proprietà";
  const staggerClass = `stagger-${Math.min(index + 1, 9)}`;

  // Use source_updated_at with fallback to updated_at
  const relativeDate = formatRelativeDate(source_updated_at || updated_at);

  return (
    <Link
      href={`/property/${id}`}
      className={`group block bg-[var(--color-cream)] rounded-xl overflow-hidden card-lift animate-fade-in-up ${staggerClass}`}
      style={{
        boxShadow: "var(--shadow-md)",
      }}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden bg-[var(--color-stone-dark)]">
        {thumbnail_url ? (
          <Image
            src={thumbnail_url}
            alt={`${typeLabel} in ${city}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            loading="lazy"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[var(--color-stone-dark)] to-[var(--color-sand)]">
            <svg
              className="w-20 h-20 text-[var(--color-text-light)]/30"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
              />
            </svg>
          </div>
        )}

        {/* Gradient overlay at bottom for text readability */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent" />

        {/* Property Type Badge */}
        <div className="absolute top-3 left-3">
          <span className="badge badge-light font-display">
            {typeLabel}
          </span>
        </div>

        {/* Top Right: Agent Logo and Sale Status */}
        <div className="absolute top-3 right-3 flex flex-col items-end gap-2">
          {/* Agent Logo */}
          {source_logo_url && (
            <div className="w-10 h-10 rounded-lg bg-white shadow-md overflow-hidden flex items-center justify-center">
              <Image
                src={source_logo_url}
                alt="Agent"
                width={36}
                height={36}
                className="object-contain"
                unoptimized
              />
            </div>
          )}
          {/* Sale Status Badge (In Contract / Sold) */}
          {sale_status && saleStatusConfig[sale_status] && (
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${saleStatusConfig[sale_status].bgColor} ${saleStatusConfig[sale_status].textColor} shadow-md`}>
              {saleStatusConfig[sale_status].label}
            </span>
          )}
        </div>

        {/* Price overlay at bottom */}
        <div className="absolute bottom-3 left-3 right-3">
          <span className="font-display text-2xl font-semibold text-white drop-shadow-lg">
            {formatPrice(price_eur)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5">
        {/* Location */}
        <div className="flex items-center gap-2 mb-3">
          <svg
            className="w-4 h-4 text-[var(--color-terracotta)]"
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
          <span className="font-display text-lg font-medium text-[var(--color-text)]">
            {city}
          </span>
        </div>

        {/* Updated date and divider */}
        <div className="flex items-center justify-between mb-3">
          <div className="h-px bg-[var(--color-sand)] flex-1" />
          {relativeDate && (
            <span className="text-xs text-[var(--color-text-light)] px-3 whitespace-nowrap">
              {relativeDate}
            </span>
          )}
        </div>

        {/* Features */}
        <div className="flex items-center gap-5 text-sm text-[var(--color-text-muted)]">
          {/* Bedrooms */}
          {bedrooms !== null && (
            <div className="flex items-center gap-1.5">
              <svg
                className="w-[18px] h-[18px] text-[var(--color-olive)]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 9.75h16.5m-16.5 0v7.5a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5v-7.5m-16.5 0V8.25a3 3 0 013-3h3a3 3 0 013 3v1.5m0 0h6m-6 0v-1.5a3 3 0 013-3h3a3 3 0 013 3v1.5"
                />
              </svg>
              <span className="font-medium">
                {bedrooms} <span className="hidden sm:inline">bed{bedrooms !== 1 ? "s" : ""}</span>
              </span>
            </div>
          )}

          {/* Bathrooms */}
          {bathrooms !== null && (
            <div className="flex items-center gap-1.5">
              <svg
                className="w-[18px] h-[18px] text-[var(--color-olive)]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 15h15m-15 0v3.75a1.5 1.5 0 001.5 1.5h12a1.5 1.5 0 001.5-1.5V15m-15 0v-3a4.5 4.5 0 014.5-4.5h.75V6a1.5 1.5 0 011.5-1.5h1.5a1.5 1.5 0 011.5 1.5v1.5h.75a4.5 4.5 0 014.5 4.5v3"
                />
              </svg>
              <span className="font-medium">
                {bathrooms} <span className="hidden sm:inline">bath{bathrooms !== 1 ? "s" : ""}</span>
              </span>
            </div>
          )}

          {/* Living Area */}
          {living_area_sqm !== null && (
            <div className="flex items-center gap-1.5">
              <svg
                className="w-[18px] h-[18px] text-[var(--color-olive)]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
                />
              </svg>
              <span className="font-medium">{living_area_sqm} m²</span>
            </div>
          )}
        </div>
      </div>

      {/* Hover accent line */}
      <div className="h-1 bg-gradient-to-r from-[var(--color-terracotta)] to-[var(--color-olive)] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
    </Link>
  );
}
