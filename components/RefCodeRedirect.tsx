"use client";

/**
 * Ref Code Redirect Component
 *
 * Checks for ?ref= URL parameter and redirects to the property if found.
 * Used on the home page to support direct linking from parent sites.
 */

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export function RefCodeRedirect() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const refCode = searchParams.get("ref");
    if (refCode) {
      // Redirect to the ref code route which will handle the lookup
      router.replace(`/ref/${encodeURIComponent(refCode.toUpperCase())}`);
    }
  }, [searchParams, router]);

  return null;
}
