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

    const getContentHeight = () => {
      // Find the actual bottom of content by checking all direct children of body
      // This avoids feedback loops from scrollHeight which includes the iframe's own height
      const body = document.body;
      const children = body.children;
      let maxBottom = 0;

      for (let i = 0; i < children.length; i++) {
        const child = children[i] as HTMLElement;
        const rect = child.getBoundingClientRect();
        const bottom = rect.bottom + window.scrollY;
        if (bottom > maxBottom) {
          maxBottom = bottom;
        }
      }

      // Add a small buffer for any margins/padding
      return Math.ceil(maxBottom) + 50;
    };

    const sendHeight = () => {
      const height = getContentHeight();

      window.parent.postMessage(
        {
          type: "iframe-height",
          height: height,
        },
        "*"
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
    const initialTimeout4 = setTimeout(sendHeight, 2000);

    // Also wait for images
    waitForImages();

    // Send height on resize
    window.addEventListener("resize", sendHeight);

    // Send height when page fully loads
    window.addEventListener("load", sendHeight);

    // Observe DOM changes that might affect height
    const observer = new MutationObserver(() => {
      setTimeout(sendHeight, 100);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    // Send height periodically but less frequently
    const interval = setInterval(sendHeight, 1000);

    return () => {
      clearTimeout(initialTimeout1);
      clearTimeout(initialTimeout2);
      clearTimeout(initialTimeout3);
      clearTimeout(initialTimeout4);
      clearInterval(interval);
      window.removeEventListener("resize", sendHeight);
      window.removeEventListener("load", sendHeight);
      observer.disconnect();
    };
  }, []);

  return null;
}
