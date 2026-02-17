/**
 * Natural Language Search Component
 *
 * Allows users to search for properties using freeform text queries.
 * Uses AI to parse the query and find matching properties.
 */

"use client";

import { useState } from "react";
import { PropertyCard } from "./PropertyCard";

import { PropertySummary } from "@/types/database";

interface SearchResult {
  filters: Record<string, unknown>;
  properties: PropertySummary[];
  count: number;
  error?: string;
}

interface NaturalLanguageSearchProps {
  regionSlug?: string;
  placeholder?: string;
}

export function NaturalLanguageSearch({
  regionSlug,
  placeholder = 'Try: "2 bedroom under €80,000 with sea view"',
}: NaturalLanguageSearchProps) {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim()) return;

    setIsSearching(true);
    setHasSearched(true);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, regionSlug }),
      });

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error("Search failed:", error);
      setResults({ filters: {}, properties: [], count: 0, error: "Search failed" });
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setQuery("");
    setResults(null);
    setHasSearched(false);
  };

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <form onSubmit={handleSearch} className="relative">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="w-full px-4 py-3 pl-12 rounded-lg border border-[var(--color-sand)] bg-[var(--color-cream)] dark:bg-gray-800 dark:border-gray-700 text-[var(--color-text)] dark:text-gray-200 placeholder:text-[var(--color-text-light)] focus:outline-none focus:ring-2 focus:ring-[var(--color-terracotta)] focus:border-transparent transition-shadow"
            />
            {/* Search Icon */}
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-light)]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
          </div>
          <button
            type="submit"
            disabled={isSearching || !query.trim()}
            className="px-6 py-3 bg-[var(--color-terracotta)] hover:bg-[var(--color-terracotta-dark)] disabled:bg-[var(--color-sand)] text-white font-medium rounded-lg transition-colors duration-200 flex items-center gap-2"
          >
            {isSearching ? (
              <>
                <svg
                  className="animate-spin w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                >
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
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Searching...
              </>
            ) : (
              "Search"
            )}
          </button>
        </div>

        {/* Example queries */}
        <div className="mt-2 flex flex-wrap gap-2 text-sm">
          <span className="text-[var(--color-text-light)]">Try:</span>
          {[
            "2 bed under €50,000",
            "villa with pool",
            "sea view apartment",
            "renovated with garden",
          ].map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => setQuery(example)}
              className="text-[var(--color-terracotta)] hover:underline"
            >
              {example}
            </button>
          ))}
        </div>
      </form>

      {/* Results */}
      {hasSearched && (
        <div className="space-y-4">
          {/* Results Header */}
          <div className="flex items-center justify-between">
            <div className="text-[var(--color-text)]">
              {results?.error ? (
                <span className="text-red-600">{results.error}</span>
              ) : results?.count === 0 ? (
                <span>No properties found matching your criteria</span>
              ) : (
                <span>
                  Found <strong>{results?.count}</strong> matching{" "}
                  {results?.count === 1 ? "property" : "properties"}
                </span>
              )}
            </div>
            <button
              onClick={clearSearch}
              className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-terracotta)] flex items-center gap-1"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Clear search
            </button>
          </div>

          {/* Parsed Filters (debug info) */}
          {results?.filters && Object.keys(results.filters).length > 0 && (
            <div className="text-sm text-[var(--color-text-muted)] bg-[var(--color-stone)] dark:bg-gray-800 p-3 rounded-lg">
              <span className="font-medium">Understood: </span>
              {Object.entries(results.filters)
                .map(([key, value]) => {
                  const labels: Record<string, string> = {
                    minBedrooms: "min beds",
                    maxBedrooms: "max beds",
                    minBathrooms: "min baths",
                    maxBathrooms: "max baths",
                    minPrice: "min price",
                    maxPrice: "max price",
                    propertyTypes: "type",
                    hasSeaView: "sea view",
                    hasGarden: "garden",
                    hasPool: "pool",
                    hasTerrace: "terrace",
                    hasBalcony: "balcony",
                    hasParking: "parking",
                    hasGarage: "garage",
                    isRenovated: "renovated",
                    hasMountainView: "mountain view",
                    hasPanoramicView: "panoramic view",
                  };
                  const label = labels[key] || key;
                  const displayValue = Array.isArray(value)
                    ? value.join(", ")
                    : typeof value === "boolean"
                    ? value
                      ? "yes"
                      : "no"
                    : typeof value === "number"
                    ? value.toLocaleString()
                    : String(value);
                  return `${label}: ${displayValue}`;
                })
                .join(" • ")}
            </div>
          )}

          {/* Property Grid */}
          {results?.properties && results.properties.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.properties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
