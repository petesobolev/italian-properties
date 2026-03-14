"use client";

/**
 * Share Reference Code Component
 *
 * Displays the property reference code with copy-to-clipboard functionality.
 */

import { useState } from "react";

interface ShareRefCodeProps {
  refCode: string;
  baseUrl?: string;
}

export function ShareRefCode({ refCode, baseUrl = "" }: ShareRefCodeProps) {
  const [copied, setCopied] = useState<"code" | "url" | null>(null);

  const shareUrl = `${baseUrl}/ref/${refCode}`;

  const copyToClipboard = async (text: string, type: "code" | "url") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  return (
    <div className="mt-6 pt-4 border-t border-[var(--color-sand)]">
      <p className="text-xs text-center text-[var(--color-text-muted)] mb-3">
        Share this property
      </p>

      {/* Reference Code */}
      <div className="flex items-center justify-center gap-2 mb-3">
        <button
          onClick={() => copyToClipboard(refCode, "code")}
          className="group flex items-center gap-2 font-mono text-lg font-semibold text-[var(--color-text)] bg-[var(--color-sand)] px-3 py-1.5 rounded-lg hover:bg-[var(--color-stone-dark)] transition-colors cursor-pointer"
          title="Copy reference code"
        >
          {refCode}
          <svg
            className="w-4 h-4 text-[var(--color-text-muted)] group-hover:text-[var(--color-terracotta)] transition-colors"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            {copied === "code" ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 12.75l6 6 9-13.5"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
              />
            )}
          </svg>
        </button>
      </div>

      {copied === "code" && (
        <p className="text-xs text-center text-green-600 mb-2">Code copied!</p>
      )}

      {/* Share URL */}
      <button
        onClick={() => copyToClipboard(shareUrl, "url")}
        className="w-full text-xs text-center text-[var(--color-terracotta)] hover:text-[var(--color-terracotta-dark)] transition-colors cursor-pointer flex items-center justify-center gap-1"
      >
        {copied === "url" ? (
          <>
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            Link copied!
          </>
        ) : (
          <>
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
            </svg>
            Copy share link
          </>
        )}
      </button>
    </div>
  );
}
