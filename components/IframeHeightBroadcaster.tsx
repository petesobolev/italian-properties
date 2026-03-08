"use client";

/**
 * Iframe Height Broadcaster
 *
 * Sends the document height to the parent window via postMessage.
 * This allows the parent page to resize the iframe to fit its content,
 * eliminating the need for a scrollbar within the iframe.
 */

import { useEffect } from "react";

export function IframeHeightBroadcaster() {
  useEffect(() => {
    // Only run if we're in an iframe
    if (window.self === window.top) {
      return;
    }

    const sendHeight = () => {
      const height = document.documentElement.scrollHeight;
      window.parent.postMessage(
        {
          type: "iframe-height",
          height: height,
        },
        "*" // Allow any origin since we don't know which sites embed us
      );
    };

    // Send initial height after a short delay to ensure content is rendered
    const initialTimeout = setTimeout(sendHeight, 100);

    // Send height on resize
    window.addEventListener("resize", sendHeight);

    // Observe DOM changes that might affect height
    const observer = new MutationObserver(() => {
      // Debounce the height update
      setTimeout(sendHeight, 50);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    });

    // Also observe resize of images and other media
    const resizeObserver = new ResizeObserver(() => {
      sendHeight();
    });
    resizeObserver.observe(document.body);

    // Send height periodically to catch any missed updates
    const interval = setInterval(sendHeight, 1000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
      window.removeEventListener("resize", sendHeight);
      observer.disconnect();
      resizeObserver.disconnect();
    };
  }, []);

  return null;
}
