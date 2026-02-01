/**
 * Demo Map Page
 *
 * Shows the property map with mock data for UI preview.
 * Displays properties across Tuscany, Calabria, and Puglia regions.
 */

import Link from "next/link";
import { PropertyMap } from "@/components/PropertyMap";

// Mock properties with coordinates across Italian regions
const mockProperties = [
  // Tuscany
  {
    id: "demo-tuscany-1",
    city: "Florence",
    price_eur: 485000,
    bedrooms: 3,
    bathrooms: 2,
    property_type: "apartment",
    thumbnail_url: "https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=400&h=300&fit=crop",
    latitude: 43.7696,
    longitude: 11.2558,
  },
  {
    id: "demo-tuscany-2",
    city: "San Gimignano",
    price_eur: 385000,
    bedrooms: 3,
    bathrooms: 2,
    property_type: "farmhouse",
    thumbnail_url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop",
    latitude: 43.4677,
    longitude: 11.0432,
  },
  {
    id: "demo-tuscany-3",
    city: "Siena",
    price_eur: 620000,
    bedrooms: 4,
    bathrooms: 3,
    property_type: "villa",
    thumbnail_url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop",
    latitude: 43.3188,
    longitude: 11.3308,
  },
  {
    id: "demo-tuscany-4",
    city: "Lucca",
    price_eur: 295000,
    bedrooms: 2,
    bathrooms: 1,
    property_type: "townhouse",
    thumbnail_url: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop",
    latitude: 43.8429,
    longitude: 10.5027,
  },

  // Calabria
  {
    id: "demo-calabria-1",
    city: "Tropea",
    price_eur: 245000,
    bedrooms: 2,
    bathrooms: 1,
    property_type: "apartment",
    thumbnail_url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop",
    latitude: 38.6766,
    longitude: 15.8984,
  },
  {
    id: "demo-calabria-2",
    city: "Pizzo",
    price_eur: 175000,
    bedrooms: 3,
    bathrooms: 2,
    property_type: "apartment",
    thumbnail_url: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop",
    latitude: 38.7292,
    longitude: 16.1588,
  },
  {
    id: "demo-calabria-3",
    city: "Scalea",
    price_eur: 89000,
    bedrooms: 2,
    bathrooms: 1,
    property_type: "apartment",
    thumbnail_url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop",
    latitude: 39.8141,
    longitude: 15.7912,
  },

  // Puglia
  {
    id: "demo-puglia-1",
    city: "Ostuni",
    price_eur: 380000,
    bedrooms: 3,
    bathrooms: 2,
    property_type: "villa",
    thumbnail_url: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400&h=300&fit=crop",
    latitude: 40.7293,
    longitude: 17.5767,
  },
  {
    id: "demo-puglia-2",
    city: "Alberobello",
    price_eur: 195000,
    bedrooms: 2,
    bathrooms: 1,
    property_type: "townhouse",
    thumbnail_url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&h=300&fit=crop",
    latitude: 40.7846,
    longitude: 17.2366,
  },
  {
    id: "demo-puglia-3",
    city: "Polignano a Mare",
    price_eur: 550000,
    bedrooms: 4,
    bathrooms: 3,
    property_type: "villa",
    thumbnail_url: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=400&h=300&fit=crop",
    latitude: 40.9968,
    longitude: 17.2200,
  },
  {
    id: "demo-puglia-4",
    city: "Lecce",
    price_eur: 275000,
    bedrooms: 3,
    bathrooms: 2,
    property_type: "apartment",
    thumbnail_url: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=400&h=300&fit=crop",
    latitude: 40.3516,
    longitude: 18.1752,
  },
];

export default function DemoMapPage() {
  return (
    <div className="min-h-screen bg-[var(--color-stone)]">
      {/* Demo Banner */}
      <div className="bg-[var(--color-terracotta)] text-white text-center py-2 text-sm">
        🗺️ This is a demo map with sample properties to preview the UI
      </div>

      {/* Header */}
      <div className="bg-[var(--color-cream)] border-b border-[var(--color-sand)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <nav className="flex items-center gap-2 text-sm mb-2">
                <Link
                  href="/"
                  className="text-[var(--color-text-muted)] hover:text-[var(--color-terracotta)] transition-colors"
                >
                  Home
                </Link>
                <ChevronIcon />
                <span className="text-[var(--color-text)] font-medium">
                  Map View
                </span>
              </nav>
              <h1 className="font-display text-3xl sm:text-4xl text-[var(--color-text)]">
                Explore Properties on Map
              </h1>
              <p className="mt-2 text-[var(--color-text-muted)]">
                {mockProperties.length} properties across Tuscany, Calabria & Puglia
              </p>
            </div>

            {/* Region Legend */}
            <div className="flex flex-wrap gap-3">
              <RegionBadge name="Tuscany" count={4} />
              <RegionBadge name="Calabria" count={3} />
              <RegionBadge name="Puglia" count={4} />
            </div>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="bg-[var(--color-cream)] rounded-xl border border-[var(--color-sand)] overflow-hidden" style={{ boxShadow: "var(--shadow-lg)" }}>
          {/* Map Instructions */}
          <div className="px-4 py-3 border-b border-[var(--color-sand)] bg-white/50">
            <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Click on markers to view property details. Use scroll to zoom.</span>
            </div>
          </div>

          {/* Map */}
          <PropertyMap
            properties={mockProperties}
            center={[40.8, 14.5]} // Center on southern Italy
            zoom={6}
            className="h-[500px] sm:h-[600px] lg:h-[700px]"
          />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
          <StatCard
            icon={<HomeIcon />}
            value={mockProperties.length}
            label="Properties"
          />
          <StatCard
            icon={<MapPinIcon />}
            value={3}
            label="Regions"
          />
          <StatCard
            icon={<EuroIcon />}
            value="€89K - €620K"
            label="Price Range"
          />
          <StatCard
            icon={<BedroomIcon />}
            value="2-4"
            label="Bedrooms"
          />
        </div>

        {/* Links to Other Demo Pages */}
        <div className="mt-8 p-6 bg-[var(--color-cream)] rounded-xl border border-[var(--color-sand)]">
          <h2 className="font-display text-xl text-[var(--color-text)] mb-4">
            Explore Other Demo Pages
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/demo/property"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[var(--color-sand)] rounded-lg text-sm font-medium text-[var(--color-text)] hover:border-[var(--color-terracotta)] hover:shadow-sm transition-all"
            >
              <svg className="w-4 h-4 text-[var(--color-terracotta)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
              Property Detail Page
            </Link>
            <Link
              href="/tuscany"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[var(--color-sand)] rounded-lg text-sm font-medium text-[var(--color-text)] hover:border-[var(--color-terracotta)] hover:shadow-sm transition-all"
            >
              <svg className="w-4 h-4 text-[var(--color-terracotta)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
              Property Grid (Tuscany)
            </Link>
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

function RegionBadge({ name, count }: { name: string; count: number }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-[var(--color-sand)]">
      <div className="w-2 h-2 rounded-full bg-[var(--color-terracotta)]" />
      <span className="text-sm font-medium text-[var(--color-text)]">{name}</span>
      <span className="text-xs text-[var(--color-text-muted)]">({count})</span>
    </div>
  );
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) {
  return (
    <div className="bg-[var(--color-cream)] rounded-xl p-4 border border-[var(--color-sand)]">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-[var(--color-terracotta)]/10 flex items-center justify-center text-[var(--color-terracotta)]">
          {icon}
        </div>
        <div>
          <div className="font-display text-lg font-medium text-[var(--color-text)]">{value}</div>
          <div className="text-xs text-[var(--color-text-muted)]">{label}</div>
        </div>
      </div>
    </div>
  );
}

function HomeIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
  );
}

function EuroIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 7.756a4.5 4.5 0 100 8.488M7.5 10.5h5.25m-5.25 3h5.25" />
    </svg>
  );
}

function BedroomIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
    </svg>
  );
}

export const metadata = {
  title: "Map View | Italian Properties",
  description: "Explore Italian properties on an interactive map across Tuscany, Calabria, and Puglia.",
};
