/**
 * Property Filters Component
 *
 * Sidebar filters for property listings with Mediterranean styling.
 * Uses URL search params for shareable/bookmarkable filter states.
 */

"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useTransition } from "react";

/**
 * Filter configuration and options
 */
const PRICE_RANGES = [
  { label: "Any Price", min: 0, max: Infinity, value: "" },
  { label: "Under €50,000", min: 0, max: 50000, value: "0-50000" },
  { label: "€50,000 - €100,000", min: 50000, max: 100000, value: "50000-100000" },
  { label: "€100,000 - €200,000", min: 100000, max: 200000, value: "100000-200000" },
  { label: "€200,000 - €500,000", min: 200000, max: 500000, value: "200000-500000" },
  { label: "Over €500,000", min: 500000, max: Infinity, value: "500000-" },
];

const BEDROOM_OPTIONS = [
  { label: "Any", value: "" },
  { label: "1+", value: "1" },
  { label: "2+", value: "2" },
  { label: "3+", value: "3" },
  { label: "4+", value: "4" },
  { label: "5+", value: "5" },
];

const BATHROOM_OPTIONS = [
  { label: "Any", value: "" },
  { label: "1+", value: "1" },
  { label: "2+", value: "2" },
  { label: "3+", value: "3" },
];

const PROPERTY_TYPES = [
  { label: "All Types", value: "" },
  { label: "Appartamento", value: "apartment" },
  { label: "Villa", value: "villa" },
  { label: "Casale", value: "farmhouse" },
  { label: "Casa a Schiera", value: "townhouse" },
  { label: "Attico", value: "penthouse" },
  { label: "Terreno", value: "land" },
];

const SIZE_RANGES = [
  { label: "Any Size", value: "" },
  { label: "Under 50 m²", value: "0-50" },
  { label: "50 - 100 m²", value: "50-100" },
  { label: "100 - 150 m²", value: "100-150" },
  { label: "150 - 200 m²", value: "150-200" },
  { label: "200 - 300 m²", value: "200-300" },
  { label: "Over 300 m²", value: "300-" },
];

interface PropertyFiltersProps {
  className?: string;
}

export function PropertyFilters({ className = "" }: PropertyFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Get current filter values from URL
  const currentPrice = searchParams.get("price") || "";
  const currentBedrooms = searchParams.get("beds") || "";
  const currentBathrooms = searchParams.get("baths") || "";
  const currentType = searchParams.get("type") || "";
  const currentSeaView = searchParams.get("seaView") === "true";
  const currentGarden = searchParams.get("garden") === "true";

  // Update URL with new filter value
  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());

      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [pathname, router, searchParams]
  );

  // Clear all filters
  const clearFilters = useCallback(() => {
    startTransition(() => {
      router.push(pathname, { scroll: false });
    });
  }, [pathname, router]);

  const hasActiveFilters =
    currentPrice || currentBedrooms || currentBathrooms || currentType || currentSeaView || currentGarden;

  return (
    <aside
      className={`bg-[var(--color-cream)] rounded-xl border border-[var(--color-sand)] p-6 ${className}`}
      style={{ boxShadow: "var(--shadow-sm)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-xl text-[var(--color-text)]">
          Filters
        </h2>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-[var(--color-terracotta)] hover:text-[var(--color-terracotta-dark)] transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Loading indicator */}
      {isPending && (
        <div className="mb-4 flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
          <svg className="w-4 h-4 animate-spin\" viewBox="0 0 24 24" fill="none">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span>Updating...</span>
        </div>
      )}

      <div className="space-y-6">
        {/* Price Range */}
        <FilterSection title="Price Range" icon={<PriceIcon />}>
          <select
            value={currentPrice}
            onChange={(e) => updateFilter("price", e.target.value)}
            className="filter-select"
          >
            {PRICE_RANGES.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
        </FilterSection>

        {/* Bedrooms */}
        <FilterSection title="Bedrooms" icon={<BedroomIcon />}>
          <div className="flex flex-wrap gap-2">
            {BEDROOM_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => updateFilter("beds", option.value)}
                className={`filter-chip ${
                  currentBedrooms === option.value ? "filter-chip-active" : ""
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Bathrooms */}
        <FilterSection title="Bathrooms" icon={<BathroomIcon />}>
          <div className="flex flex-wrap gap-2">
            {BATHROOM_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => updateFilter("baths", option.value)}
                className={`filter-chip ${
                  currentBathrooms === option.value ? "filter-chip-active" : ""
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Property Type */}
        <FilterSection title="Property Type" icon={<PropertyIcon />}>
          <select
            value={currentType}
            onChange={(e) => updateFilter("type", e.target.value)}
            className="filter-select"
          >
            {PROPERTY_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </FilterSection>

        {/* Features */}
        <FilterSection title="Features" icon={<FeaturesIcon />}>
          <div className="space-y-3">
            {/* Sea View Toggle */}
            <label className="flex items-center justify-between cursor-pointer group">
              <div className="flex items-center gap-2">
                <SeaViewIcon />
                <span className="text-sm text-[var(--color-text-muted)] group-hover:text-[var(--color-text)] transition-colors">
                  Sea View
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={currentSeaView}
                onClick={() => updateFilter("seaView", currentSeaView ? "" : "true")}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  currentSeaView
                    ? "bg-[var(--color-terracotta)]"
                    : "bg-[var(--color-sand)]"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                    currentSeaView ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </label>

            {/* Garden Toggle */}
            <label className="flex items-center justify-between cursor-pointer group">
              <div className="flex items-center gap-2">
                <GardenIcon />
                <span className="text-sm text-[var(--color-text-muted)] group-hover:text-[var(--color-text)] transition-colors">
                  Garden
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={currentGarden}
                onClick={() => updateFilter("garden", currentGarden ? "" : "true")}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  currentGarden
                    ? "bg-[var(--color-terracotta)]"
                    : "bg-[var(--color-sand)]"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                    currentGarden ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </label>
          </div>
        </FilterSection>
      </div>
    </aside>
  );
}

/**
 * Filter section wrapper
 */
function FilterSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[var(--color-olive)]">{icon}</span>
        <h3 className="font-medium text-[var(--color-text)] text-sm">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

/**
 * Mobile filter drawer trigger
 */
export function MobileFilterTrigger({
  activeCount,
  onClick,
}: {
  activeCount: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--color-cream)] border border-[var(--color-sand)] rounded-lg text-[var(--color-text)] font-medium hover:border-[var(--color-terracotta)] transition-colors"
    >
      <svg
        className="w-5 h-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"
        />
      </svg>
      <span>Filters</span>
      {activeCount > 0 && (
        <span className="inline-flex items-center justify-center w-5 h-5 text-xs bg-[var(--color-terracotta)] text-white rounded-full">
          {activeCount}
        </span>
      )}
    </button>
  );
}

// Icons
function PriceIcon() {
  return (
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.25 7.756a4.5 4.5 0 100 8.488M7.5 10.5h5.25m-5.25 3h5.25M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function BedroomIcon() {
  return (
    <svg
      className="w-4 h-4"
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
  );
}

function BathroomIcon() {
  return (
    <svg
      className="w-4 h-4"
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
  );
}

function PropertyIcon() {
  return (
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
      />
    </svg>
  );
}

function FeaturesIcon() {
  return (
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
      />
    </svg>
  );
}

function SeaViewIcon() {
  return (
    <svg
      className="w-4 h-4 text-[var(--color-olive)]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2 16.5c1.5-1 3-1 4.5 0s3 1 4.5 0 3-1 4.5 0 3 1 4.5 0"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2 20c1.5-1 3-1 4.5 0s3 1 4.5 0 3-1 4.5 0 3 1 4.5 0"
      />
    </svg>
  );
}

function GardenIcon() {
  return (
    <svg
      className="w-4 h-4 text-[var(--color-olive)]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M12 12.75c-2.5 0-4.5-2-4.5-4.5 0-2 1.5-3.5 3-4.5.5-.3 1-.5 1.5-.5s1 .2 1.5.5c1.5 1 3 2.5 3 4.5 0 2.5-2 4.5-4.5 4.5z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.75 14.25c-1.5 0-2.75-1.25-2.75-2.75 0-1.25 1-2.25 2-3 .33-.25.67-.4 1-.5M17.25 14.25c1.5 0 2.75-1.25 2.75-2.75 0-1.25-1-2.25-2-3-.33-.25-.67-.4-1-.5"
      />
    </svg>
  );
}
