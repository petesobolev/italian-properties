"use client";

/**
 * Contact Email Editor Component
 *
 * Allows agents to set/update their contact email for receiving
 * property inquiry messages from potential buyers.
 */

import { useState } from "react";

interface ContactEmailEditorProps {
  currentEmail: string | null;
  token: string;
}

export default function ContactEmailEditor({ currentEmail, token }: ContactEmailEditorProps) {
  const [savedEmail, setSavedEmail] = useState(currentEmail);
  const [email, setEmail] = useState(currentEmail || "");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/admin/contact-email", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email: email || null }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update email");
      }

      setSavedEmail(email || null);
      setSuccessMessage("Contact email updated successfully");
      setIsEditing(false);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update email");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEmail(savedEmail || "");
    setIsEditing(false);
    setError(null);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Contact Email</span>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            {savedEmail ? "Edit" : "Add"}
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Property inquiries from visitors will be sent to this email.
          </p>
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="px-3 py-1.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div>
          {savedEmail ? (
            <p className="text-sm text-gray-900 dark:text-gray-100">{savedEmail}</p>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
              No contact email set. Add one to receive property inquiries.
            </p>
          )}
          {successMessage && (
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">{successMessage}</p>
          )}
        </div>
      )}
    </div>
  );
}
