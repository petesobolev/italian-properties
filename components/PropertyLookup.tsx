"use client";

/**
 * Property Lookup Component
 *
 * Allows users to enter a reference code to navigate directly to a property.
 * Can be used inline on pages or in a modal/popup.
 */

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

interface PropertyLookupProps {
  /** Optional placeholder text */
  placeholder?: string;
  /** Optional CSS class for the container */
  className?: string;
  /** Compact mode for header/navbar use */
  compact?: boolean;
}

export function PropertyLookup({
  placeholder = "Enter code (e.g., IT-A3X7K)",
  className = "",
  compact = false,
}: PropertyLookupProps) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const trimmedCode = code.trim().toUpperCase();
    if (!trimmedCode) {
      setError("Please enter a reference code");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/lookup?code=${encodeURIComponent(trimmedCode)}`);
      const data = await response.json();

      if (response.ok && data.found) {
        router.push(data.url);
      } else {
        setError(data.error || "Property not found");
      }
    } catch {
      setError("Failed to lookup property");
    } finally {
      setLoading(false);
    }
  };

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className={`flex items-center gap-2 ${className}`}>
        <input
          type="text"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setError(null);
          }}
          placeholder="Ref code"
          className={`w-28 px-2 py-1.5 text-sm border rounded-md bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-terracotta)] ${
            error ? "border-red-400" : "border-gray-300"
          }`}
          maxLength={10}
        />
        <button
          type="submit"
          disabled={loading}
          className="px-3 py-1.5 text-sm font-medium text-white bg-[var(--color-terracotta)] rounded-md hover:bg-[var(--color-terracotta-dark)] disabled:opacity-50 transition-colors"
        >
          {loading ? "..." : "Go"}
        </button>
      </form>
    );
  }

  return (
    <div className={`${className}`}>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError(null);
            }}
            placeholder={placeholder}
            className={`w-full px-4 py-3 text-lg border rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-terracotta)] ${
              error ? "border-red-400" : "border-gray-300"
            }`}
            maxLength={10}
          />
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 text-lg font-medium text-white bg-[var(--color-terracotta)] rounded-lg hover:bg-[var(--color-terracotta-dark)] disabled:opacity-50 transition-colors whitespace-nowrap"
        >
          {loading ? "Looking up..." : "Find Property"}
        </button>
      </form>
      <p className="mt-2 text-sm text-gray-500">
        Enter the property reference code to view its listing
      </p>
    </div>
  );
}
