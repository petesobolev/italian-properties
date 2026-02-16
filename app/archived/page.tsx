/**
 * Archived Listings Page
 *
 * Displays properties that are no longer listed on source websites.
 * These are preserved for historical reference.
 */

import Link from "next/link";
import { getArchivedProperties, getArchivedPropertyCount } from "@/lib/properties";
import { PropertyGrid } from "@/components/PropertyGrid";

export default async function ArchivedPage() {
  const [properties, count] = await Promise.all([
    getArchivedProperties(),
    getArchivedPropertyCount(),
  ]);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="hero-fixed relative bg-[var(--color-text)] text-white overflow-hidden">
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
            <span className="text-white">Archived Listings</span>
          </nav>

          {/* Page Header */}
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-block w-12 h-1 bg-[var(--color-text-muted)]" />
              <span className="font-display text-white/60 italic">
                No longer available
              </span>
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-medium mb-6">
              Archived Listings
            </h1>
            <p className="text-lg sm:text-xl text-white/80 leading-relaxed">
              These properties are no longer listed on their original source websites.
              They are preserved here for historical reference.
            </p>
          </div>
        </div>

        {/* Decorative wave */}
        <div className="wave-divider absolute bottom-0 left-0 right-0">
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

      {/* Listings Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Header with count */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--color-text-muted)]/10 dark:bg-gray-700">
              <svg
                className="w-5 h-5 text-[var(--color-text-muted)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
                />
              </svg>
            </div>
            <div>
              <h2 className="font-display text-xl text-[var(--color-text)]">
                {count} {count === 1 ? "Archived Listing" : "Archived Listings"}
              </h2>
              <p className="text-sm text-[var(--color-text-muted)]">
                Properties no longer on source websites
              </p>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        {count > 0 && (
          <div className="mb-8 p-4 bg-[var(--color-cream)] dark:bg-gray-800 rounded-lg border border-[var(--color-sand)] dark:border-gray-700">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-[var(--color-olive)] dark:text-gray-400 mt-0.5 flex-shrink-0"
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
                <p className="font-medium text-[var(--color-text)]">
                  These listings may no longer be available
                </p>
                <p className="text-[var(--color-text-muted)]">
                  Properties are archived when they are removed from their source website.
                  The original listing links may no longer work.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Property Grid */}
        <PropertyGrid
          properties={properties}
          emptyMessage="No archived listings yet. Properties are archived when they are removed from source websites."
        />

        {/* Back to Home Link */}
        {count > 0 && (
          <div className="mt-12 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-text)] dark:bg-gray-700 text-white rounded-lg font-medium hover:bg-[var(--color-terracotta)] transition-colors duration-200"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                />
              </svg>
              Browse Active Listings
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}

/**
 * Page metadata for SEO
 */
export const metadata = {
  title: "Archived Listings | Italian Properties",
  description:
    "View properties that are no longer listed on their original source websites. Preserved for historical reference.",
};
