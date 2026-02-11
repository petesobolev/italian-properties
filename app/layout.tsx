import type { Metadata } from "next";
import Link from "next/link";
import { ThemeProvider, ThemeScript } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import "./globals.css";

/**
 * Root Layout Component
 *
 * Modern Mediterranean design with elegant header navigation.
 * Features warm terracotta accents and sophisticated typography.
 */

export const metadata: Metadata = {
  title: "Italian Properties | Find Your Dream Home in Italy",
  description:
    "Discover exceptional properties across Tuscany, Calabria, and Puglia. Villas, farmhouses, and apartments in Italy's most beautiful regions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Source+Sans+3:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap"
          rel="stylesheet"
        />
        {/* Leaflet CSS for map components */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css"
          integrity="sha512-Zcn6bjR/8RZbLEpLIeOwNtzREBAJnUKESxces60Mpoj+2okopSAcSUIUOseddDm0cxnGQzxIR7vJgsLZbdLE3w=="
          crossOrigin="anonymous"
        />
        {/* MarkerCluster CSS for clustered markers */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/MarkerCluster.css"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/MarkerCluster.Default.css"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-screen antialiased">
        <ThemeProvider>
        {/* Elegant Header */}
        <header className="sticky top-0 z-50 bg-[var(--color-cream)]/95 backdrop-blur-md border-b border-[var(--color-sand)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 sm:h-20">
              {/* Logo */}
              <Link href="/" className="group flex items-center gap-3">
                {/* Decorative icon */}
                <div className="w-10 h-10 rounded-lg bg-[var(--color-terracotta)] flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow duration-300">
                  <svg
                    className="w-6 h-6 text-white"
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
                <div>
                  <span className="font-display text-xl sm:text-2xl font-medium text-[var(--color-text)] tracking-tight">
                    Italian Properties
                  </span>
                  <span className="hidden sm:block text-xs text-[var(--color-text-muted)] tracking-wide">
                    Tuscany · Calabria · Puglia
                  </span>
                </div>
              </Link>

              {/* Navigation */}
              <nav className="hidden md:flex items-center gap-8">
                <Link
                  href="/tuscany"
                  className="text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-terracotta)] transition-colors duration-200"
                >
                  Tuscany
                </Link>
                <Link
                  href="/calabria"
                  className="text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-terracotta)] transition-colors duration-200"
                >
                  Calabria
                </Link>
                <Link
                  href="/puglia"
                  className="text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-terracotta)] transition-colors duration-200"
                >
                  Puglia
                </Link>
                <div className="relative">
                  <ThemeToggle />
                </div>
              </nav>

              {/* Mobile actions */}
              <div className="flex md:hidden items-center gap-2">
                <div className="relative">
                  <ThemeToggle />
                </div>
                <button
                  className="p-2 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-stone-dark)] transition-colors"
                  aria-label="Menu"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="min-h-[calc(100vh-5rem)]">{children}</main>

        {/* Footer */}
        <footer className="hero-fixed bg-[var(--color-text)] text-[var(--color-stone)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Brand */}
              <div>
                <h3 className="font-display text-xl text-white mb-3">
                  Italian Properties
                </h3>
                <p className="text-sm text-[var(--color-text-light)] leading-relaxed">
                  Discover your dream home in Italy&apos;s most enchanting
                  regions. From Tuscan villas to Puglian trulli.
                </p>
              </div>

              {/* Regions */}
              <div>
                <h4 className="font-display text-sm uppercase tracking-wider text-[var(--color-sand)] mb-4">
                  Regions
                </h4>
                <ul className="space-y-2">
                  <li>
                    <Link
                      href="/tuscany"
                      className="text-sm text-[var(--color-text-light)] hover:text-white transition-colors"
                    >
                      Tuscany
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/calabria"
                      className="text-sm text-[var(--color-text-light)] hover:text-white transition-colors"
                    >
                      Calabria
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/puglia"
                      className="text-sm text-[var(--color-text-light)] hover:text-white transition-colors"
                    >
                      Puglia
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Contact */}
              <div>
                <h4 className="font-display text-sm uppercase tracking-wider text-[var(--color-sand)] mb-4">
                  Contact
                </h4>
                <p className="text-sm text-[var(--color-text-light)]">
                  Questions about a property?
                  <br />
                  <span className="text-white">info@italianproperties.com</span>
                </p>
              </div>
            </div>

            {/* Copyright */}
            <div className="mt-12 pt-8 border-t border-[var(--color-text-muted)]/20">
              <p className="text-xs text-[var(--color-text-light)] text-center">
                © {new Date().getFullYear()} Italian Properties. All rights
                reserved.
              </p>
            </div>
          </div>
        </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
