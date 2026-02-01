/**
 * Property Grid Component
 *
 * Displays a responsive grid of property cards with staggered animations.
 * Mediterranean editorial aesthetic with elegant empty and loading states.
 */

import { PropertySummary } from "@/types";
import { PropertyCard } from "./PropertyCard";

interface PropertyGridProps {
  properties: PropertySummary[];
  emptyMessage?: string;
}

export function PropertyGrid({
  properties,
  emptyMessage = "No properties available",
}: PropertyGridProps) {
  if (properties.length === 0) {
    return (
      <div className="py-16 sm:py-24 text-center">
        {/* Empty state illustration */}
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-[var(--color-cream)] mb-6 shadow-sm">
          <svg
            className="w-12 h-12 text-[var(--color-terracotta)]"
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
        <h3 className="font-display text-2xl text-[var(--color-text)] mb-2">
          {emptyMessage}
        </h3>
        <p className="text-[var(--color-text-muted)] max-w-md mx-auto">
          We&apos;re constantly adding new properties. Check back soon or explore
          another region.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
      {properties.map((property, index) => (
        <PropertyCard key={property.id} property={property} index={index} />
      ))}
    </div>
  );
}

/**
 * Elegant loading skeleton for the property grid
 */
export function PropertyGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-[var(--color-cream)] rounded-xl overflow-hidden animate-fade-in-up"
          style={{
            boxShadow: "var(--shadow-sm)",
            animationDelay: `${i * 0.05}s`,
          }}
        >
          {/* Image skeleton */}
          <div className="aspect-[4/3] shimmer" />

          {/* Content skeleton */}
          <div className="p-5 space-y-4">
            {/* City skeleton */}
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded shimmer" />
              <div className="h-5 w-32 rounded shimmer" />
            </div>

            {/* Divider */}
            <div className="h-px bg-[var(--color-sand)]" />

            {/* Features skeleton */}
            <div className="flex gap-5">
              <div className="h-4 w-14 rounded shimmer" />
              <div className="h-4 w-14 rounded shimmer" />
              <div className="h-4 w-16 rounded shimmer" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Results count header
 */
export function PropertyGridHeader({
  count,
  regionName,
  hasFilters = false,
}: {
  count: number;
  regionName: string;
  hasFilters?: boolean;
}) {
  return (
    <div>
      <h2 className="font-display text-2xl sm:text-3xl text-[var(--color-text)] mb-1">
        {hasFilters ? "Filtered Results" : `Properties in ${regionName}`}
      </h2>
      <p className="text-[var(--color-text-muted)]">
        {count === 0 ? (
          hasFilters ? "No properties match your criteria" : "No properties currently available"
        ) : count === 1 ? (
          hasFilters ? "1 property matches" : "1 property available"
        ) : (
          <>
            {count.toLocaleString()} {hasFilters ? "properties match" : "properties available"}
          </>
        )}
      </p>
    </div>
  );
}
