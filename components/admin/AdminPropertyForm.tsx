"use client";

/**
 * Admin Property Form Component
 *
 * Reusable form for adding and editing properties.
 * Handles all property fields including image upload.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import ImageUploader from "./ImageUploader";
import { AdminPropertyFormData, PropertyType, SaleStatus } from "@/types";

interface AdminPropertyFormProps {
  token: string;
  initialData?: Partial<AdminPropertyFormData>;
  propertyId?: string;
  regions: Array<{ slug: string; name: string }>;
}

const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: "apartment", label: "Apartment" },
  { value: "villa", label: "Villa" },
  { value: "farmhouse", label: "Farmhouse" },
  { value: "townhouse", label: "Townhouse" },
  { value: "penthouse", label: "Penthouse" },
  { value: "studio", label: "Studio" },
  { value: "land", label: "Land" },
  { value: "commercial", label: "Commercial" },
  { value: "other", label: "Other" },
];

const SALE_STATUSES: { value: SaleStatus; label: string }[] = [
  { value: "available", label: "Available" },
  { value: "in_contract", label: "In Contract" },
  { value: "sold", label: "Sold" },
];

export default function AdminPropertyForm({
  token,
  initialData,
  propertyId,
  regions,
}: AdminPropertyFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<AdminPropertyFormData>({
    region_slug: initialData?.region_slug || (regions[0]?.slug ?? ""),
    city: initialData?.city || "",
    address: initialData?.address || "",
    price_eur: initialData?.price_eur || 0,
    bedrooms: initialData?.bedrooms ?? null,
    bathrooms: initialData?.bathrooms ?? null,
    living_area_sqm: initialData?.living_area_sqm ?? null,
    property_type: initialData?.property_type || "apartment",
    description_it: initialData?.description_it || "",
    image_urls: initialData?.image_urls || [],
    sale_status: initialData?.sale_status || "available",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const url = "/api/admin/properties";
      const method = propertyId ? "PUT" : "POST";
      const body = propertyId ? { id: propertyId, ...formData } : formData;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Token": token,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save property");
      }

      // Redirect back to dashboard
      router.push(`/admin/${token}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const updateField = <K extends keyof AdminPropertyFormData>(
    field: K,
    value: AdminPropertyFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Images */}
      <section>
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Photos
        </h2>
        <ImageUploader
          images={formData.image_urls}
          onChange={(urls) => updateField("image_urls", urls)}
          token={token}
        />
      </section>

      {/* Location */}
      <section>
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Location
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Region *
            </label>
            <select
              value={formData.region_slug}
              onChange={(e) => updateField("region_slug", e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {regions.map((region) => (
                <option key={region.slug} value={region.slug}>
                  {region.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              City *
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => updateField("city", e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Florence"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Address
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => updateField("address", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Via Roma 123"
            />
          </div>
        </div>
      </section>

      {/* Property Details */}
      <section>
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Property Details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Property Type *
            </label>
            <select
              value={formData.property_type}
              onChange={(e) => updateField("property_type", e.target.value as PropertyType)}
              required
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {PROPERTY_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Price (EUR) *
            </label>
            <input
              type="number"
              value={formData.price_eur || ""}
              onChange={(e) => updateField("price_eur", parseInt(e.target.value) || 0)}
              required
              min="0"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., 150000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Sale Status *
            </label>
            <select
              value={formData.sale_status}
              onChange={(e) => updateField("sale_status", e.target.value as SaleStatus)}
              required
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {SALE_STATUSES.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Bedrooms
            </label>
            <input
              type="number"
              value={formData.bedrooms ?? ""}
              onChange={(e) =>
                updateField("bedrooms", e.target.value ? parseInt(e.target.value) : null)
              }
              min="0"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., 3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Bathrooms
            </label>
            <input
              type="number"
              value={formData.bathrooms ?? ""}
              onChange={(e) =>
                updateField("bathrooms", e.target.value ? parseInt(e.target.value) : null)
              }
              min="0"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., 2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Living Area (sqm)
            </label>
            <input
              type="number"
              value={formData.living_area_sqm ?? ""}
              onChange={(e) =>
                updateField("living_area_sqm", e.target.value ? parseInt(e.target.value) : null)
              }
              min="0"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., 120"
            />
          </div>
        </div>
      </section>

      {/* Description */}
      <section>
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Description
        </h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description (Italian)
          </label>
          <textarea
            value={formData.description_it}
            onChange={(e) => updateField("description_it", e.target.value)}
            rows={6}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Describe the property in Italian. It will be automatically translated to English when saved."
          />
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            The English translation will be generated automatically when you save.
          </p>
        </div>
      </section>

      {/* Actions */}
      <div className="flex gap-4 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={() => router.push(`/admin/${token}`)}
          className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>Save Property</>
          )}
        </button>
      </div>
    </form>
  );
}
