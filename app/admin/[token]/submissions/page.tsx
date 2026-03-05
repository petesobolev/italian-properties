/**
 * Contact Submissions Page
 *
 * Displays all contact form submissions for the agent.
 */

import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { validateToken } from "@/lib/admin";
import SubmissionsList from "@/components/admin/SubmissionsList";

interface Props {
  params: Promise<{ token: string }>;
}

export const metadata: Metadata = {
  title: "Contact Submissions | Italian Properties",
  robots: "noindex, nofollow",
};

export default async function SubmissionsPage({ params }: Props) {
  const { token } = await params;

  // Validate token
  const source = await validateToken(token);
  if (!source) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Contact Submissions
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {source.name}
              </p>
            </div>
            <Link
              href={`/admin/${token}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SubmissionsList token={token} />
      </main>
    </div>
  );
}
