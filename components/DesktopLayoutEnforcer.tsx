"use client";

/**
 * Desktop Layout Enforcer
 *
 * Detects ?layout=desktop URL parameter and adds a class to the body
 * that forces desktop layout regardless of viewport width.
 * Used for iframe embeds that need consistent desktop appearance.
 */

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export function DesktopLayoutEnforcer() {
  const searchParams = useSearchParams();
  const forceDesktop = searchParams.get("layout") === "desktop";

  useEffect(() => {
    if (forceDesktop) {
      document.body.classList.add("force-desktop");
    } else {
      document.body.classList.remove("force-desktop");
    }

    return () => {
      document.body.classList.remove("force-desktop");
    };
  }, [forceDesktop]);

  return null;
}
