"use client";

/**
 * Logo Uploader Component
 *
 * Allows agents to upload or change their agency logo.
 */

import { useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface LogoUploaderProps {
  currentLogo: string | null;
  token: string;
}

export default function LogoUploader({ currentLogo, token }: LogoUploaderProps) {
  const router = useRouter();
  const [logo, setLogo] = useState<string | null>(currentLogo);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("logo", file);

      const response = await fetch("/api/admin/logo", {
        method: "POST",
        headers: {
          "X-Admin-Token": token,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const { url } = await response.json();
      setLogo(url);
      router.refresh();
    } catch (error) {
      console.error("Logo upload error:", error);
      alert("Failed to upload logo. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm("Remove your agency logo?")) return;

    setUploading(true);

    try {
      const response = await fetch("/api/admin/logo", {
        method: "DELETE",
        headers: {
          "X-Admin-Token": token,
        },
      });

      if (!response.ok) {
        throw new Error("Delete failed");
      }

      setLogo(null);
      router.refresh();
    } catch (error) {
      console.error("Logo delete error:", error);
      alert("Failed to remove logo. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      {/* Logo Preview */}
      <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-gray-700 overflow-hidden flex items-center justify-center border border-gray-200 dark:border-gray-600">
        {logo ? (
          <Image
            src={logo}
            alt="Agency logo"
            width={56}
            height={56}
            className="object-contain"
            unoptimized
          />
        ) : (
          <svg
            className="w-8 h-8 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z"
            />
          </svg>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-1">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
        >
          {uploading ? "Uploading..." : logo ? "Change logo" : "Upload logo"}
        </button>
        {logo && !uploading && (
          <button
            type="button"
            onClick={handleRemove}
            className="text-sm text-red-600 dark:text-red-400 hover:underline"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
