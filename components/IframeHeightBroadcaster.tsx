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
  const maxSendsPerPage = 20; // Limit updates to prevent infinite loops

  useEffect(() => {
    // Only run if we're in an iframe
    if (window.self === window.top) {
      return;
    }

    // Reset counters on page change
    lastSentHeight.current = 0;
    sendCount.current = 0;

    const getContentHeight = () => {
      // Use document.body.scrollHeight as primary - most reliable
      const scrollHeight = document.body.scrollHeight;
      const docScrollHeight = document.documentElement.scrollHeight;

      // Return the larger of the two measurements
      return Math.max(scrollHeight, docScrollHeight);
    };

    const sendHeight = (force = false) => {
      // Prevent too many updates (feedback loop protection)
      if (!force && sendCount.current >= maxSendsPerPage) {
        return;
      }

      const height = getContentHeight();

      // Ensure minimum height of 800px
      const finalHeight = Math.max(height, 800);

      // Only send if height changed significantly (prevents micro-adjustments)
      if (!force && Math.abs(finalHeight - lastSentHeight.current) < 50) {
        return;
      }

      lastSentHeight.current = finalHeight;
      sendCount.current++;

      window.parent.postMessage(
        {
          type: "iframe-height",
          height: finalHeight,
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

    // Send initial height after content renders at various delays
    const initialTimeout1 = setTimeout(() => sendHeight(true), 100);
    const initialTimeout2 = setTimeout(() => sendHeight(true), 300);
    const initialTimeout3 = setTimeout(() => sendHeight(true), 500);
    const initialTimeout4 = setTimeout(() => sendHeight(true), 1000);
    const initialTimeout5 = setTimeout(() => sendHeight(true), 2000);
    const initialTimeout6 = setTimeout(() => sendHeight(true), 3000);

    // Wait for images
    waitForImages();

    // Send height when page fully loads
    const handleLoad = () => sendHeight(true);
    window.addEventListener("load", handleLoad);

    // Send height on resize
    const handleResize = () => sendHeight(true);
    window.addEventListener("resize", handleResize);

    // Limited periodic check for async content (stops after max sends reached)
    const interval = setInterval(() => {
      if (sendCount.current < maxSendsPerPage) {
        sendHeight(false);
      }
    }, 500);

    // Stop the interval after 10 seconds
    const stopInterval = setTimeout(() => clearInterval(interval), 10000);

    return () => {
      clearTimeout(initialTimeout1);
      clearTimeout(initialTimeout2);
      clearTimeout(initialTimeout3);
      clearTimeout(initialTimeout4);
      clearTimeout(initialTimeout5);
      clearTimeout(initialTimeout6);
      clearTimeout(stopInterval);
      clearInterval(interval);
      window.removeEventListener("load", handleLoad);
      window.removeEventListener("resize", handleResize);
    };
  }, [pathname]); // Re-run when pathname changes

  return null;
}
