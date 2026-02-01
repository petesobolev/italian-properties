/**
 * Home Page Component
 *
 * Landing page for the Italian Properties application.
 * Mediterranean editorial design with elegant region showcases.
 */

import Link from "next/link";
import { getRegionsWithCounts } from "@/lib/properties";

/**
 * Region data with descriptions and imagery
 */
const regionShowcase = [
  {
    slug: "tuscany",
    name: "Tuscany",
    italian: "Toscana",
    tagline: "Rolling hills & Renaissance charm",
    description:
      "From the vineyards of Chianti to the medieval towers of San Gimignano, Tuscany offers timeless Italian beauty and world-renowned art.",
    gradient: "from-[#C4633A] to-[#A34E2B]",
    accentColor: "var(--color-terracotta)",
  },
  {
    slug: "calabria",
    name: "Calabria",
    italian: "Calabria",
    tagline: "The toe of Italy's boot",
    description:
      "Crystal-clear waters, ancient Greek ruins, and authentic southern Italian culture await in this hidden gem of the Mediterranean.",
    gradient: "from-[#5C6B4A] to-[#4A5639]",
    accentColor: "var(--color-olive)",
  },
  {
    slug: "puglia",
    name: "Puglia",
    italian: "Puglia",
    tagline: "Whitewashed villages & olive groves",
    description:
      "Discover trulli houses, baroque architecture, and endless coastline in Italy's sun-drenched heel.",
    gradient: "from-[#8B2942] to-[#6B1F33]",
    accentColor: "var(--color-burgundy)",
  },
];

export default async function HomePage() {
  // Fetch all region counts in a single query (instead of N separate queries)
  const regionsWithCounts = await getRegionsWithCounts();
  const countMap = Object.fromEntries(
    regionsWithCounts.map((r) => [r.slug, r.count])
  );

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-[var(--color-text)] text-white overflow-hidden">
        {/* Decorative background pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 0L100 50L50 100L0 50Z' fill='none' stroke='%23ffffff' stroke-width='0.5'/%3E%3C/svg%3E")`,
            backgroundSize: "50px 50px",
          }}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-terracotta)]/20 via-transparent to-[var(--color-olive)]/20" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32 lg:py-40">
          <div className="max-w-4xl">
            {/* Decorative line */}
            <div className="flex items-center gap-4 mb-8">
              <span className="w-16 h-px bg-[var(--color-terracotta)]" />
              <span className="font-display text-[var(--color-terracotta-light)] italic text-sm tracking-wide">
                La dolce vita awaits
              </span>
            </div>

            {/* Main headline */}
            <h1 className="font-display text-4xl sm:text-5xl lg:text-7xl font-medium leading-[1.1] mb-6">
              Find Your
              <br />
              <span className="text-[var(--color-terracotta-light)]">
                Italian Dream
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-white/70 leading-relaxed max-w-2xl mb-10">
              Discover exceptional properties across Italy&apos;s most enchanting
              regions. From Tuscan villas to Puglian trulli, your Mediterranean
              escape begins here.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4">
              <Link
                href="#regions"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-terracotta)] hover:bg-[var(--color-terracotta-dark)] text-white font-medium rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
              >
                Explore Regions
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-20"
            preserveAspectRatio="none"
          >
            <path
              d="M0 80h1440V40c-180 20-360 30-540 30s-360-10-540-30-360-30-540-30v70z"
              fill="var(--color-stone)"
            />
          </svg>
        </div>
      </section>

      {/* Regions Showcase */}
      <section id="regions" className="py-16 sm:py-24 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="flex items-center justify-center gap-4 mb-4">
              <span className="w-8 h-px bg-[var(--color-terracotta)]" />
              <span className="font-display text-[var(--color-terracotta)] italic text-sm">
                Discover Italy
              </span>
              <span className="w-8 h-px bg-[var(--color-terracotta)]" />
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-[var(--color-text)] mb-4">
              Explore Our Regions
            </h2>
            <p className="text-[var(--color-text-muted)] text-lg">
              Each corner of Italy has its own unique character, cuisine, and
              charm. Find your perfect destination.
            </p>
          </div>

          {/* Region Cards */}
          <div className="grid gap-8 lg:gap-12">
            {regionShowcase.map((region, index) => (
              <Link
                key={region.slug}
                href={`/${region.slug}`}
                className={`group relative bg-[var(--color-cream)] rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 ${
                  index % 2 === 1 ? "lg:flex-row-reverse" : ""
                }`}
              >
                <div
                  className={`flex flex-col lg:flex-row ${
                    index % 2 === 1 ? "lg:flex-row-reverse" : ""
                  }`}
                >
                  {/* Image/Gradient Side */}
                  <div
                    className={`relative lg:w-2/5 aspect-[16/10] lg:aspect-auto bg-gradient-to-br ${region.gradient}`}
                  >
                    {/* Pattern overlay */}
                    <div
                      className="absolute inset-0 opacity-20"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Ccircle cx='20' cy='20' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                      }}
                    />

                    {/* Region Number */}
                    <div className="absolute top-6 left-6 font-display text-8xl font-bold text-white/10">
                      0{index + 1}
                    </div>

                    {/* Italian name */}
                    <div className="absolute bottom-6 left-6 right-6">
                      <span className="font-display text-5xl lg:text-6xl font-medium text-white/90 tracking-tight">
                        {region.italian}
                      </span>
                    </div>

                    {/* Hover arrow */}
                    <div className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                      <svg
                        className="w-6 h-6 text-white"
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
                    </div>
                  </div>

                  {/* Content Side */}
                  <div className="lg:w-3/5 p-8 lg:p-12 flex flex-col justify-center">
                    {/* Tagline */}
                    <div className="flex items-center gap-3 mb-3">
                      <span
                        className="w-8 h-0.5"
                        style={{ backgroundColor: region.accentColor }}
                      />
                      <span
                        className="font-display italic text-sm"
                        style={{ color: region.accentColor }}
                      >
                        {region.tagline}
                      </span>
                    </div>

                    {/* Region Name */}
                    <h3 className="font-display text-3xl lg:text-4xl text-[var(--color-text)] mb-4 group-hover:text-[var(--color-terracotta)] transition-colors duration-300">
                      {region.name}
                    </h3>

                    {/* Description */}
                    <p className="text-[var(--color-text-muted)] leading-relaxed mb-6">
                      {region.description}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center gap-6">
                      <div>
                        <span className="block font-display text-2xl text-[var(--color-text)]">
                          {countMap[region.slug]?.toLocaleString() || "—"}
                        </span>
                        <span className="text-sm text-[var(--color-text-light)]">
                          Properties
                        </span>
                      </div>
                      <div className="w-px h-10 bg-[var(--color-sand)]" />
                      <div className="flex items-center gap-2 text-[var(--color-terracotta)] font-medium">
                        <span>View listings</span>
                        <svg
                          className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-200"
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
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-[var(--color-cream)] border-y border-[var(--color-sand)] py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-3 gap-8 lg:gap-12">
            {/* Feature 1 */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--color-terracotta)]/10 mb-5">
                <svg
                  className="w-8 h-8 text-[var(--color-terracotta)]"
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
              </div>
              <h3 className="font-display text-xl text-[var(--color-text)] mb-2">
                Curated Listings
              </h3>
              <p className="text-[var(--color-text-muted)] text-sm leading-relaxed">
                Hand-selected properties from trusted Italian real estate
                sources, updated daily.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--color-olive)]/10 mb-5">
                <svg
                  className="w-8 h-8 text-[var(--color-olive)]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
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
              </div>
              <h3 className="font-display text-xl text-[var(--color-text)] mb-2">
                Prime Locations
              </h3>
              <p className="text-[var(--color-text-muted)] text-sm leading-relaxed">
                Properties in Italy&apos;s most sought-after regions, from coastal
                towns to hilltop villages.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--color-burgundy)]/10 mb-5">
                <svg
                  className="w-8 h-8 text-[var(--color-burgundy)]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="font-display text-xl text-[var(--color-text)] mb-2">
                Great Value
              </h3>
              <p className="text-[var(--color-text-muted)] text-sm leading-relaxed">
                Discover hidden gems and investment opportunities in emerging
                Italian markets.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl sm:text-4xl text-[var(--color-text)] mb-4">
            Ready to find your Italian home?
          </h2>
          <p className="text-[var(--color-text-muted)] text-lg mb-8">
            Start exploring properties in your favorite region today.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {regionShowcase.map((region) => (
              <Link
                key={region.slug}
                href={`/${region.slug}`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-cream)] border border-[var(--color-sand)] rounded-lg text-[var(--color-text)] font-medium hover:border-[var(--color-terracotta)] hover:shadow-md transition-all duration-200"
              >
                {region.name}
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
      </section>
    </div>
  );
}
