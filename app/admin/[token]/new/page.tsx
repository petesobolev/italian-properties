/**
 * Add Property Page
 *
 * Form for adding a new property listing.
 */

import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { validateToken, getRegions } from "@/lib/admin";
import AdminPropertyForm from "@/components/admin/AdminPropertyForm";

interface Props {
  params: Promise<{ token: string }>;
}

export const metadata: Metadata = {
  title: "Add Property | Admin | Italian Properties",
  robots: "noindex, nofollow",
};

export default async function AddPropertyPage({ params }: Props) {
  const { token } = await params;

  // Validate token
  const source = await validateToken(token);
  if (!source) {
    notFound();
  }

  // Get regions for dropdown
  const regions = await getRegions();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link
              href={`/admin/${token}`}
              className="p-2 -ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Add Property
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {source.name}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <AdminPropertyForm token={token} regions={regions} />
        </div>
      </main>
    </div>
  );
}
