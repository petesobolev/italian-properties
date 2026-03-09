"use client";

/**
 * Iframe Height Broadcaster
 *
 * Sends the document height to the parent window via postMessage.
 * This allows the parent page to resize the iframe to fit its content,
 * eliminating the need for a scrollbar within the iframe.
 */

import { useEffect } from "react";

// Extra padding to ensure content isn't cut off
const HEIGHT_BUFFER = 100;

export function IframeHeightBroadcaster() {
  useEffect(() => {
    // Only run if we're in an iframe
    if (window.self === window.top) {
      return;
    }

    const sendHeight = () => {
      // Get the maximum height from multiple sources to ensure we capture everything
      const scrollHeight = document.documentElement.scrollHeight;
      const bodyScrollHeight = document.body.scrollHeight;
      const bodyOffsetHeight = document.body.offsetHeight;

      // Use the maximum of all measurements plus buffer
      const height = Math.max(scrollHeight, bodyScrollHeight, bodyOffsetHeight) + HEIGHT_BUFFER;

      window.parent.postMessage(
        {
          type: "iframe-height",
          height: height,
        },
        "*" // Allow any origin since we don't know which sites embed us
      );
    };

    // Wait for all images to load before sending initial height
    const waitForImages = () => {
      const images = document.querySelectorAll("img");
      const imagePromises = Array.from(images).map((img) => {
        if (img.complete) {
          return Promise.resolve();
        }
        return new Promise<void>((resolve) => {
          img.addEventListener("load", () => resolve(), { once: true });
          img.addEventListener("error", () => resolve(), { once: true });
        });
      });

      Promise.all(imagePromises).then(() => {
        sendHeight();
      });
    };

    // Send initial height after delays to ensure content is rendered
    const initialTimeout1 = setTimeout(sendHeight, 100);
    const initialTimeout2 = setTimeout(sendHeight, 500);
    const initialTimeout3 = setTimeout(sendHeight, 1000);

    // Also wait for images
    waitForImages();

    // Send height on resize
    window.addEventListener("resize", sendHeight);

    // Send height when images load
    window.addEventListener("load", sendHeight);

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
    const interval = setInterval(sendHeight, 500);

    return () => {
      clearTimeout(initialTimeout1);
      clearTimeout(initialTimeout2);
      clearTimeout(initialTimeout3);
      clearInterval(interval);
      window.removeEventListener("resize", sendHeight);
      window.removeEventListener("load", sendHeight);
      observer.disconnect();
      resizeObserver.disconnect();
    };
  }, []);

  return null;
}
