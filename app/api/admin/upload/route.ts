/**
 * Image Upload API
 *
 * Handles image uploads to Vercel Blob storage.
 * Validates admin token before allowing uploads.
 */

import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { validateToken } from "@/lib/admin";

export async function POST(request: NextRequest) {
  try {
    // Get token from header
    const token = request.headers.get("X-Admin-Token");
    if (!token) {
      return NextResponse.json(
        { error: "Missing authentication token" },
        { status: 401 }
      );
    }

    // Validate token
    const source = await validateToken(token);
    if (!source) {
      return NextResponse.json(
        { error: "Invalid authentication token" },
        { status: 401 }
      );
    }

    // Get form data with files
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      );
    }

    // Upload each file to Vercel Blob
    const uploadedUrls: string[] = [];

    for (const file of files) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        continue; // Skip non-image files
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(7);
      const extension = file.name.split(".").pop() || "jpg";
      const filename = `properties/${source.id}/${timestamp}-${randomStr}.${extension}`;

      // Upload to Vercel Blob
      const blob = await put(filename, file, {
        access: "public",
        addRandomSuffix: false,
      });

      uploadedUrls.push(blob.url);
    }

    return NextResponse.json({ urls: uploadedUrls });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload images" },
      { status: 500 }
    );
  }
}
