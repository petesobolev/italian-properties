/**
 * Property Reference Code Redirect Page
 *
 * Allows direct URL access via /ref/IT-A3X7K
 * Redirects to the full property page if found.
 */

import { redirect, notFound } from "next/navigation";
import { getPropertyByRefCode } from "@/lib/properties";

interface RefPageProps {
  params: Promise<{
    code: string;
  }>;
}

export default async function RefPage({ params }: RefPageProps) {
  const { code } = await params;

  const property = await getPropertyByRefCode(code);

  if (!property) {
    notFound();
  }

  redirect(`/property/${property.id}`);
}

/**
 * Generate metadata for SEO
 */
export async function generateMetadata({ params }: RefPageProps) {
  const { code } = await params;

  return {
    title: `Property ${code.toUpperCase()} | Italian Properties`,
    description: `View property listing ${code.toUpperCase()}`,
  };
}
