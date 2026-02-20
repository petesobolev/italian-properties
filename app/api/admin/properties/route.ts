/**
 * Properties CRUD API
 *
 * Handles create, read, update, delete operations for properties.
 * All operations validate admin token and enforce source ownership.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  validateToken,
  getPropertiesBySource,
  createProperty,
  updateProperty,
  deleteProperty,
} from "@/lib/admin";
import { translateToEnglish } from "@/lib/translate";
import { AdminPropertyFormData } from "@/types";

/**
 * GET - List all properties for the authenticated source
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");
    if (!token) {
      return NextResponse.json(
        { error: "Missing authentication token" },
        { status: 401 }
      );
    }

    const source = await validateToken(token);
    if (!source) {
      return NextResponse.json(
        { error: "Invalid authentication token" },
        { status: 401 }
      );
    }

    const properties = await getPropertiesBySource(source.id);
    return NextResponse.json({ properties, source: { id: source.id, name: source.name } });
  } catch (error) {
    console.error("Error fetching properties:", error);
    return NextResponse.json(
      { error: "Failed to fetch properties" },
      { status: 500 }
    );
  }
}

/**
 * POST - Create a new property
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("X-Admin-Token");
    if (!token) {
      return NextResponse.json(
        { error: "Missing authentication token" },
        { status: 401 }
      );
    }

    const source = await validateToken(token);
    if (!source) {
      return NextResponse.json(
        { error: "Invalid authentication token" },
        { status: 401 }
      );
    }

    const data: AdminPropertyFormData = await request.json();

    // Validate required fields
    if (!data.city || !data.price_eur || !data.property_type || !data.region_slug) {
      return NextResponse.json(
        { error: "Missing required fields: city, price_eur, property_type, region_slug" },
        { status: 400 }
      );
    }

    // Auto-translate Italian description to English
    let descriptionEn: string | null = null;
    if (data.description_it) {
      descriptionEn = await translateToEnglish(data.description_it);
    }

    const result = await createProperty(source.id, data, descriptionEn);
    if (!result) {
      return NextResponse.json(
        { error: "Failed to create property" },
        { status: 500 }
      );
    }

    return NextResponse.json({ id: result.id, success: true });
  } catch (error) {
    console.error("Error creating property:", error);
    return NextResponse.json(
      { error: "Failed to create property" },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update an existing property
 */
export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get("X-Admin-Token");
    if (!token) {
      return NextResponse.json(
        { error: "Missing authentication token" },
        { status: 401 }
      );
    }

    const source = await validateToken(token);
    if (!source) {
      return NextResponse.json(
        { error: "Invalid authentication token" },
        { status: 401 }
      );
    }

    const { id, ...data }: { id: string } & Partial<AdminPropertyFormData> = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Missing property ID" },
        { status: 400 }
      );
    }

    // Auto-translate Italian description to English if changed
    let descriptionEn: string | null | undefined = undefined;
    if (data.description_it !== undefined) {
      descriptionEn = data.description_it ? await translateToEnglish(data.description_it) : null;
    }

    const success = await updateProperty(id, source.id, data, descriptionEn);
    if (!success) {
      return NextResponse.json(
        { error: "Failed to update property or property not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating property:", error);
    return NextResponse.json(
      { error: "Failed to update property" },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete a property
 */
export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get("X-Admin-Token");
    if (!token) {
      return NextResponse.json(
        { error: "Missing authentication token" },
        { status: 401 }
      );
    }

    const source = await validateToken(token);
    if (!source) {
      return NextResponse.json(
        { error: "Invalid authentication token" },
        { status: 401 }
      );
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Missing property ID" },
        { status: 400 }
      );
    }

    const success = await deleteProperty(id, source.id);
    if (!success) {
      return NextResponse.json(
        { error: "Failed to delete property or property not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting property:", error);
    return NextResponse.json(
      { error: "Failed to delete property" },
      { status: 500 }
    );
  }
}
