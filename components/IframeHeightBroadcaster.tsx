"use client";

/**
 * Iframe Height Broadcaster
 *
 * Sends the document height to the parent window via postMessage.
 * This allows the parent page to resize the iframe to fit its content,
 * eliminating the need for a scrollbar within the iframe.
 */

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function IframeHeightBroadcaster() {
  const pathname = usePathname();
  const lastSentHeight = useRef<number>(0);
  const sendCount = useRef<number>(0);
  const maxSendsPerPage = 10; // Limit updates to prevent infinite loops

  useEffect(() => {
    // Only run if we're in an iframe
    if (window.self === window.top) {
      return;
    }

    // Reset counters on page change
    lastSentHeight.current = 0;
    sendCount.current = 0;

    const getContentHeight = () => {
      // Use the main content element if available, otherwise body children
      const main = document.querySelector("main");
      if (main) {
        const rect = main.getBoundingClientRect();
        const mainBottom = rect.bottom + window.scrollY;
        return Math.ceil(mainBottom);
      }

      // Fallback: find bottom of body children
      const body = document.body;
      const children = body.children;
      let maxBottom = 0;

      for (let i = 0; i < children.length; i++) {
        const child = children[i] as HTMLElement;
        // Skip script tags and hidden elements
        if (child.tagName === 'SCRIPT' || child.offsetHeight === 0) continue;
        const rect = child.getBoundingClientRect();
        const bottom = rect.bottom + window.scrollY;
        if (bottom > maxBottom) {
          maxBottom = bottom;
        }
      }

      return Math.ceil(maxBottom);
    };

    const sendHeight = (force = false) => {
      // Prevent too many updates (feedback loop protection)
      if (!force && sendCount.current >= maxSendsPerPage) {
        return;
      }

      const height = getContentHeight();

      // Only send if height changed by more than 10px (prevents micro-adjustments)
      if (!force && Math.abs(height - lastSentHeight.current) < 10) {
        return;
      }

      lastSentHeight.current = height;
      sendCount.current++;

      window.parent.postMessage(
        {
          type: "iframe-height",
          height: height,
        },
        "*"
      );
    };

    // Wait for all images to load before sending height
    const waitForImages = () => {
      const images = document.querySelectorAll("img");
      let loadedCount = 0;
      const totalImages = images.length;

      if (totalImages === 0) {
        sendHeight(true);
        return;
      }

      const checkAllLoaded = () => {
        loadedCount++;
        if (loadedCount >= totalImages) {
          sendHeight(true);
        }
      };

      images.forEach((img) => {
        if (img.complete) {
          checkAllLoaded();
        } else {
          img.addEventListener("load", checkAllLoaded, { once: true });
          img.addEventListener("error", checkAllLoaded, { once: true });
        }
      });
    };

    // Send initial height after content renders
    const initialTimeout1 = setTimeout(() => sendHeight(true), 200);
    const initialTimeout2 = setTimeout(() => sendHeight(true), 1000);

    // Wait for images
    waitForImages();

    // Send height when page fully loads
    const handleLoad = () => sendHeight(true);
    window.addEventListener("load", handleLoad);

    return () => {
      clearTimeout(initialTimeout1);
      clearTimeout(initialTimeout2);
      window.removeEventListener("load", handleLoad);
    };
  }, [pathname]); // Re-run when pathname changes

  return null;
}
