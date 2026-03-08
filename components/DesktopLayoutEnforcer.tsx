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
 *
 * IMPORTANT: Does NOT apply force-desktop on small viewports (< 640px)
 * to ensure mobile portrait mode gets proper responsive layout.
 */

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

const SESSION_KEY = "force-desktop-layout";
const MOBILE_BREAKPOINT = 640; // Don't force desktop below this width

export function DesktopLayoutEnforcer() {
  const searchParams = useSearchParams();
  const urlHasDesktopParam = searchParams.get("layout") === "desktop";

  useEffect(() => {
    // Function to update force-desktop class based on viewport
    const updateDesktopClass = () => {
      const isMobileViewport = window.innerWidth < MOBILE_BREAKPOINT;
      const sessionHasDesktop = sessionStorage.getItem(SESSION_KEY) === "true";
      const shouldForceDesktop = (urlHasDesktopParam || sessionHasDesktop) && !isMobileViewport;

      if (shouldForceDesktop) {
        document.body.classList.add("force-desktop");
      } else {
        document.body.classList.remove("force-desktop");
      }

      // Store in session so it persists during navigation (but only if URL param present)
      if (urlHasDesktopParam && !sessionHasDesktop) {
        sessionStorage.setItem(SESSION_KEY, "true");
      }
    };

    // Initial check
    updateDesktopClass();

    // Listen for viewport changes (orientation change, resize)
    window.addEventListener("resize", updateDesktopClass);
    window.addEventListener("orientationchange", updateDesktopClass);

    return () => {
      window.removeEventListener("resize", updateDesktopClass);
      window.removeEventListener("orientationchange", updateDesktopClass);
    };
  }, [urlHasDesktopParam]);

  return null;
}
