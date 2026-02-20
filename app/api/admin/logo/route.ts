/**
 * Logo Management API
 *
 * Handles logo upload and updates for sources/agents.
 */

import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { validateToken, updateSourceLogo } from "@/lib/admin";

/**
 * POST - Upload a new logo
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

    const formData = await request.formData();
    const file = formData.get("logo") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No logo file provided" },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
    }

    // Upload to Vercel Blob
    const timestamp = Date.now();
    const extension = file.name.split(".").pop() || "png";
    const filename = `logos/${source.id}/${timestamp}.${extension}`;

    const blob = await put(filename, file, {
      access: "public",
      addRandomSuffix: false,
    });

    // Update source with new logo URL
    await updateSourceLogo(source.id, blob.url);

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("Logo upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload logo" },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Remove logo
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

    await updateSourceLogo(source.id, null);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logo delete error:", error);
    return NextResponse.json(
      { error: "Failed to remove logo" },
      { status: 500 }
    );
  }
}
