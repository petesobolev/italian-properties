/**
 * View Toggle Component
 *
 * Allows users to switch between Grid and Map views on listing pages.
 * Uses URL-based state management for shareable links.
 */

"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useTransition } from "react";

interface ViewToggleProps {
  className?: string;
}

export function ViewToggle({ className = "" }: ViewToggleProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const currentView = searchParams.get("view") || "grid";

  const setView = (view: "grid" | "map") => {
    const params = new URLSearchParams(searchParams.toString());

    if (view === "grid") {
      params.delete("view"); // Grid is default, no need to include in URL
    } else {
      params.set("view", view);
    }

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  return (
    <div
      className={`inline-flex items-center gap-1 p-1 bg-white rounded-lg border border-[var(--color-sand)] ${className}`}
      role="tablist"
      aria-label="View options"
    >
      <button
        role="tab"
        aria-selected={currentView === "grid"}
        onClick={() => setView("grid")}
        disabled={isPending}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
          ${currentView === "grid"
            ? "bg-[var(--color-terracotta)] text-white shadow-sm"
            : "text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-stone)]"
          }
          ${isPending ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <GridIcon />
        <span className="hidden sm:inline">Grid</span>
      </button>

      <button
        role="tab"
        aria-selected={currentView === "map"}
        onClick={() => setView("map")}
        disabled={isPending}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
          ${currentView === "map"
            ? "bg-[var(--color-terracotta)] text-white shadow-sm"
            : "text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-stone)]"
          }
          ${isPending ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <MapIcon />
        <span className="hidden sm:inline">Map</span>
      </button>
    </div>
  );
}

function GridIcon() {
  return (
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
        d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
      />
    </svg>
  );
}

function MapIcon() {
  return (
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
        d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z"
      />
    </svg>
  );
}
