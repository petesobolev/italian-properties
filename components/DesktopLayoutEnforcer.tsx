"use client";

/**
 * Desktop Layout Enforcer
 *
 * Detects ?layout=desktop URL parameter and adds a class to the body
 * that forces desktop layout regardless of viewport width.
 * Used for iframe embeds that need consistent desktop appearance.
 *
 * Once activated, the desktop layout persists for the entire session
 * so internal navigation doesn't revert to mobile/tablet layout.
 */

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

const SESSION_KEY = "force-desktop-layout";

export function DesktopLayoutEnforcer() {
  const searchParams = useSearchParams();
  const urlHasDesktopParam = searchParams.get("layout") === "desktop";

  useEffect(() => {
    // Check if desktop mode was previously activated this session
    const sessionHasDesktop = sessionStorage.getItem(SESSION_KEY) === "true";

    // Activate desktop mode if URL param present OR session has it stored
    if (urlHasDesktopParam || sessionHasDesktop) {
      document.body.classList.add("force-desktop");

      // Store in session so it persists during navigation
      if (urlHasDesktopParam && !sessionHasDesktop) {
        sessionStorage.setItem(SESSION_KEY, "true");
      }
    }

    // No cleanup - we want the class to persist
  }, [urlHasDesktopParam]);

  return null;
}
