"use client";

/**
 * Contact Form Component
 *
 * Allows visitors to send property inquiries to agents.
 * Pre-fills the message with property information.
 * Protected by Cloudflare Turnstile CAPTCHA.
 */

import { useState, useRef } from "react";
import { Turnstile, TurnstileInstance } from "@marsidev/react-turnstile";

interface ContactFormProps {
  propertyId: string;
  propertyTitle: string;
  propertyUrl: string;
  sourceId: string;
  sourceName: string;
}

export function ContactForm({
  propertyId,
  propertyTitle,
  propertyUrl,
  sourceId,
  sourceName,
}: ContactFormProps) {
  const defaultMessage = `Please send me more information on ${propertyTitle || "this property"}.`;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: defaultMessage,
  });
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!turnstileToken) {
      setErrorMessage("Please complete the CAPTCHA verification");
      setStatus("error");
      return;
    }

    setStatus("sending");
    setErrorMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          propertyId,
          propertyTitle,
          propertyUrl,
          sourceId,
          turnstileToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      setStatus("success");
      setFormData({
        name: "",
        email: "",
        phone: "",
        message: defaultMessage,
      });
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Failed to send message");
      // Reset Turnstile on error so user can try again
      turnstileRef.current?.reset();
      setTurnstileToken(null);
    }
  };

  if (status === "success") {
    return (
      <div className="bg-[var(--color-cream)] rounded-xl p-6 sm:p-8 border border-[var(--color-sand)]">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="font-display text-xl text-[var(--color-text)] mb-2">Message Sent!</h3>
          <p className="text-[var(--color-text-muted)]">
            Thank you for your inquiry. {sourceName} will get back to you soon.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--color-cream)] rounded-xl p-6 sm:p-8 border border-[var(--color-sand)]">
      <h3 className="font-display text-lg text-[var(--color-text)] mb-6 flex items-center gap-3">
        <span className="w-6 h-0.5 bg-[var(--color-terracotta)]" />
        Request Information
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Left column - contact fields */}
          <div className="space-y-4">
            {/* Name */}
            <div>
              <input
                type="text"
                placeholder="Name *"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-[var(--color-sand)] rounded-lg
                         bg-white text-[var(--color-text)] placeholder-[var(--color-text-light)]
                         focus:outline-none focus:ring-2 focus:ring-[var(--color-terracotta)] focus:border-transparent"
              />
            </div>

            {/* Email */}
            <div>
              <input
                type="email"
                placeholder="Email *"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-[var(--color-sand)] rounded-lg
                         bg-white text-[var(--color-text)] placeholder-[var(--color-text-light)]
                         focus:outline-none focus:ring-2 focus:ring-[var(--color-terracotta)] focus:border-transparent"
              />
            </div>

            {/* Phone */}
            <div>
              <input
                type="tel"
                placeholder="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 border border-[var(--color-sand)] rounded-lg
                         bg-white text-[var(--color-text)] placeholder-[var(--color-text-light)]
                         focus:outline-none focus:ring-2 focus:ring-[var(--color-terracotta)] focus:border-transparent"
              />
            </div>
          </div>

          {/* Right column - message */}
          <div>
            <textarea
              placeholder="Message *"
              required
              rows={5}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full h-full min-h-[140px] px-4 py-3 border border-[var(--color-sand)] rounded-lg
                       bg-white text-[var(--color-text)] placeholder-[var(--color-text-light)]
                       focus:outline-none focus:ring-2 focus:ring-[var(--color-terracotta)] focus:border-transparent
                       resize-none"
            />
          </div>
        </div>

        {/* Required fields note */}
        <p className="text-xs text-[var(--color-text-light)] text-right">* Required fields</p>

        {/* Error message */}
        {status === "error" && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {errorMessage}
          </div>
        )}

        {/* Turnstile CAPTCHA and Submit button - aligned with message field */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="hidden sm:block" /> {/* Empty spacer for left column */}
          <div className="space-y-3">
            {/* Turnstile CAPTCHA */}
            {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
              <Turnstile
                ref={turnstileRef}
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                onSuccess={setTurnstileToken}
                onError={() => setTurnstileToken(null)}
                onExpire={() => setTurnstileToken(null)}
                options={{
                  theme: "light",
                  size: "normal",
                }}
              />
            )}
            <button
              type="submit"
              disabled={status === "sending"}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2
                       px-8 py-3 bg-[var(--color-terracotta)] hover:bg-[var(--color-terracotta-dark)]
                       text-white font-medium rounded-lg transition-colors duration-200
                       shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === "sending" ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Sending...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                  Send Message
                </>
              )}
            </button>
            <p className="text-xs text-[var(--color-text-light)]">
              By submitting this form I agree to the{" "}
              <a
                href="https://www.supersavvytravelers.com/privacy-policy-terms-of-service-cookie-policy/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-terracotta)] hover:underline"
              >
                Privacy Policy and Terms of Service
              </a>
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
