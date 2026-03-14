/**
 * Property Lookup Page
 *
 * Dedicated page for entering a property reference code
 * to navigate directly to a listing.
 */

import { PropertyLookup } from "@/components/PropertyLookup";
import Link from "next/link";

export const metadata = {
  title: "Find Property by Reference Code | Italian Properties",
  description: "Enter a property reference code to view the listing details.",
};

export default function LookupPage() {
  return (
    <div className="min-h-screen bg-[var(--color-stone)]">
      {/* Header */}
      <div className="bg-[var(--color-cream)] border-b border-[var(--color-sand)]">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Link
            href="/"
            className="text-[var(--color-text-muted)] hover:text-[var(--color-terracotta)] transition-colors text-sm"
          >
            &larr; Back to listings
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="font-display text-3xl sm:text-4xl text-[var(--color-text)] mb-4">
            Find a Property
          </h1>
          <p className="text-[var(--color-text-muted)] text-lg">
            Enter the reference code to view the property listing
          </p>
        </div>

        <div className="bg-[var(--color-cream)] rounded-xl p-8 border border-[var(--color-sand)] shadow-sm">
          <PropertyLookup />
        </div>

        <div className="mt-12 text-center">
          <h2 className="font-display text-xl text-[var(--color-text)] mb-4">
            What is a reference code?
          </h2>
          <p className="text-[var(--color-text-muted)] max-w-md mx-auto">
            Each property has a unique reference code (e.g., <span className="font-mono bg-[var(--color-sand)] px-1.5 py-0.5 rounded">IT-A3X7K</span>)
            that you can use to quickly find and share specific listings.
          </p>
          <p className="text-[var(--color-text-muted)] max-w-md mx-auto mt-4">
            You&apos;ll find the reference code displayed on each property&apos;s detail page.
          </p>
        </div>
      </div>
    </div>
  );
}
