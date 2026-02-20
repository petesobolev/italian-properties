/**
 * Admin Dashboard Page
 *
 * Main dashboard for agents to manage their properties.
 * Validates token and shows properties owned by the agent.
 */

import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { validateToken, getPropertiesBySource } from "@/lib/admin";
import AdminPropertyList from "@/components/admin/AdminPropertyList";

interface Props {
  params: Promise<{ token: string }>;
}

export const metadata: Metadata = {
  title: "Admin Dashboard | Italian Properties",
  robots: "noindex, nofollow",
};

export default async function AdminDashboardPage({ params }: Props) {
  const { token } = await params;

  // Validate token
  const source = await validateToken(token);
  if (!source) {
    notFound();
  }

  // Get properties for this source
  const properties = await getPropertiesBySource(source.id);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Admin Dashboard
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {source.name}
              </p>
            </div>
            <Link
              href={`/admin/${token}/new`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Property
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Properties</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {properties.length}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">Available</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {properties.filter((p) => p.sale_status === "available").length}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">In Contract / Sold</div>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {properties.filter((p) => p.sale_status !== "available").length}
            </div>
          </div>
        </div>

        {/* Property List */}
        <AdminPropertyList properties={properties} token={token} />
      </main>
    </div>
  );
}
