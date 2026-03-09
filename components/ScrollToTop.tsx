"use client";

/**
 * Scroll To Top Component
 *
 * Automatically scrolls to the top of the page when navigating
 * between routes. Essential for iframe embeds where the parent
 * page position may not reset on navigation.
 */

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export function ScrollToTop() {
  const pathname = usePathname();
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip the first render (initial page load)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Scroll to top of the page
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });

    // Also notify parent window to scroll to top of iframe
    if (window.self !== window.top) {
      window.parent.postMessage(
        {
          type: "iframe-scroll-top",
        },
        "*"
      );
    }
  }, [pathname]);

  return null;
}
