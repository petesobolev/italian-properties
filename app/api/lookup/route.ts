/**
 * Property Lookup API
 *
 * Looks up a property by its reference code and returns its URL
 * GET /api/lookup?code=IT-A3X7K
 */

import { NextRequest, NextResponse } from "next/server";
import { getPropertyByRefCode } from "@/lib/properties";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json(
      { error: "Missing 'code' parameter" },
      { status: 400 }
    );
  }

  const property = await getPropertyByRefCode(code);

  if (!property) {
    return NextResponse.json(
      { error: "Property not found", code },
      { status: 404 }
    );
  }

  return NextResponse.json({
    found: true,
    id: property.id,
    ref_code: property.ref_code,
    url: `/property/${property.id}`,
    summary: {
      city: property.city,
      region: property.region_name,
      price_eur: property.price_eur,
      property_type: property.property_type,
    },
  });
}
