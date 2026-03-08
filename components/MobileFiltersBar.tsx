/**
 * Mobile Filters Bar Component
 *
 * Compact horizontal filter bar for mobile portrait mode.
 * Shows key filters in a scrollable row to save vertical space.
 */

"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useState, useTransition } from "react";

const PRICE_RANGES = [
  { label: "Any Price", value: "" },
  { label: "Under €50k", value: "0-50000" },
  { label: "€50k-€100k", value: "50000-100000" },
  { label: "€100k-€200k", value: "100000-200000" },
  { label: "€200k-€500k", value: "200000-500000" },
  { label: "€500k+", value: "500000-" },
];

const BEDROOM_OPTIONS = [
  { label: "Beds", value: "" },
  { label: "1+", value: "1" },
  { label: "2+", value: "2" },
  { label: "3+", value: "3" },
  { label: "4+", value: "4" },
];

const PROPERTY_TYPES = [
  { label: "All Types", value: "" },
  { label: "Apartment", value: "apartment" },
  { label: "Villa", value: "villa" },
  { label: "Farmhouse", value: "farmhouse" },
  { label: "Townhouse", value: "townhouse" },
];

const SORT_OPTIONS = [
  { label: "Recent", value: "updated" },
  { label: "Price ↑", value: "price_asc" },
  { label: "Price ↓", value: "price_desc" },
];

export function MobileFiltersBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  // Get current filter values from URL
  const currentPrice = searchParams.get("price") || "";
  const currentBedrooms = searchParams.get("beds") || "";
  const currentType = searchParams.get("type") || "";
  const currentSort = searchParams.get("sort") || "updated";
  const currentSeaView = searchParams.get("seaView") === "true";
  const currentGarden = searchParams.get("garden") === "true";
  const currentBathrooms = searchParams.get("baths") || "";

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

  const activeFilterCount = [
    currentPrice,
    currentBedrooms,
    currentBathrooms,
    currentType,
    currentSeaView ? "true" : "",
    currentGarden ? "true" : "",
  ].filter(Boolean).length;

  return (
    <div className="sm:hidden mb-4">
      {/* Main filter row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {/* Sort dropdown */}
        <select
          value={currentSort}
          onChange={(e) => updateFilter("sort", e.target.value)}
          className="mobile-filter-select flex-shrink-0"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Price dropdown */}
        <select
          value={currentPrice}
          onChange={(e) => updateFilter("price", e.target.value)}
          className={`mobile-filter-select flex-shrink-0 ${currentPrice ? "mobile-filter-active" : ""}`}
        >
          {PRICE_RANGES.map((range) => (
            <option key={range.value} value={range.value}>
              {range.label}
            </option>
          ))}
        </select>

        {/* Bedrooms dropdown */}
        <select
          value={currentBedrooms}
          onChange={(e) => updateFilter("beds", e.target.value)}
          className={`mobile-filter-select flex-shrink-0 ${currentBedrooms ? "mobile-filter-active" : ""}`}
        >
          {BEDROOM_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.value ? `${option.value}+ Beds` : option.label}
            </option>
          ))}
        </select>

        {/* Type dropdown */}
        <select
          value={currentType}
          onChange={(e) => updateFilter("type", e.target.value)}
          className={`mobile-filter-select flex-shrink-0 ${currentType ? "mobile-filter-active" : ""}`}
        >
          {PROPERTY_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>

        {/* More filters button */}
        <button
          onClick={() => setShowMoreFilters(!showMoreFilters)}
          className={`mobile-filter-select flex-shrink-0 flex items-center gap-1 ${
            (currentSeaView || currentGarden || currentBathrooms) ? "mobile-filter-active" : ""
          }`}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
          </svg>
          More
        </button>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex-shrink-0 px-3 py-1.5 text-sm text-[var(--color-terracotta)] hover:text-[var(--color-terracotta-dark)]"
          >
            Clear
          </button>
        )}

        {/* Loading indicator */}
        {isPending && (
          <div className="flex-shrink-0">
            <svg className="w-4 h-4 animate-spin text-[var(--color-terracotta)]" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        )}
      </div>

      {/* Expanded filters panel */}
      {showMoreFilters && (
        <div className="mt-2 p-3 bg-[var(--color-cream)] rounded-lg border border-[var(--color-sand)]">
          <div className="grid grid-cols-2 gap-3">
            {/* Bathrooms */}
            <div>
              <label className="text-xs font-medium text-[var(--color-text-muted)] mb-1 block">Bathrooms</label>
              <select
                value={currentBathrooms}
                onChange={(e) => updateFilter("baths", e.target.value)}
                className="mobile-filter-select w-full"
              >
                <option value="">Any</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
              </select>
            </div>

            {/* Features */}
            <div>
              <label className="text-xs font-medium text-[var(--color-text-muted)] mb-1 block">Features</label>
              <div className="flex gap-2">
                <button
                  onClick={() => updateFilter("seaView", currentSeaView ? "" : "true")}
                  className={`flex-1 px-2 py-1.5 text-xs rounded border ${
                    currentSeaView
                      ? "bg-[var(--color-terracotta)] text-white border-[var(--color-terracotta)]"
                      : "bg-white border-[var(--color-sand)] text-[var(--color-text)]"
                  }`}
                >
                  Sea View
                </button>
                <button
                  onClick={() => updateFilter("garden", currentGarden ? "" : "true")}
                  className={`flex-1 px-2 py-1.5 text-xs rounded border ${
                    currentGarden
                      ? "bg-[var(--color-terracotta)] text-white border-[var(--color-terracotta)]"
                      : "bg-white border-[var(--color-sand)] text-[var(--color-text)]"
                  }`}
                >
                  Garden
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
