"use client";

/**
 * Admin Property List Component
 *
 * Displays a grid of properties with edit/delete actions.
 */

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminProperty } from "@/types";

interface AdminPropertyListProps {
  properties: AdminProperty[];
  token: string;
}

const STATUS_BADGES: Record<string, { bg: string; text: string; label: string }> = {
  available: {
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-700 dark:text-green-300",
    label: "Available",
  },
  in_contract: {
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    text: "text-yellow-700 dark:text-yellow-300",
    label: "In Contract",
  },
  sold: {
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-700 dark:text-red-300",
    label: "Sold",
  },
};

export default function AdminPropertyList({ properties, token }: AdminPropertyListProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this property? This cannot be undone.")) {
      return;
    }

    setDeleting(id);

    try {
      const response = await fetch("/api/admin/properties", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Token": token,
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete property");
      }

      router.refresh();
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete property. Please try again.");
    } finally {
      setDeleting(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (properties.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          No properties yet
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Get started by adding your first property listing.
        </p>
        <Link
          href={`/admin/${token}/new`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Property
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {properties.map((property) => {
        const statusBadge = STATUS_BADGES[property.sale_status] || STATUS_BADGES.available;
        const isDeleting = deleting === property.id;

        return (
          <div
            key={property.id}
            className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden ${
              isDeleting ? "opacity-50" : ""
            }`}
          >
            {/* Thumbnail */}
            <div className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-900">
              {property.image_urls[0] ? (
                <Image
                  src={property.image_urls[0]}
                  alt={property.city}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              {/* Status badge */}
              <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${statusBadge.bg} ${statusBadge.text}`}>
                {statusBadge.label}
              </div>
              {/* Image count */}
              {property.image_urls.length > 1 && (
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {property.image_urls.length} photos
                </div>
              )}
            </div>

            {/* Details */}
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  {property.city}
                </h3>
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {formatPrice(property.price_eur)}
                </span>
              </div>

              <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                {property.bedrooms !== null && (
                  <span>{property.bedrooms} bed</span>
                )}
                {property.bathrooms !== null && (
                  <span>{property.bathrooms} bath</span>
                )}
                {property.living_area_sqm !== null && (
                  <span>{property.living_area_sqm} sqm</span>
                )}
              </div>

              <p className="text-xs text-gray-400 dark:text-gray-500 capitalize mb-4">
                {property.property_type.replace("_", " ")} &bull; {property.region_slug}
              </p>

              {/* Actions */}
              <div className="flex gap-2">
                <Link
                  href={`/admin/${token}/edit/${property.id}`}
                  className="flex-1 px-3 py-2 text-center text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(property.id)}
                  disabled={isDeleting}
                  className="px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isDeleting ? "..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
