/**
 * Media Upload API
 *
 * Handles image and video uploads to Vercel Blob storage.
 * Validates admin token before allowing uploads.
 *
 * Query params:
 *   type=video - Upload video files instead of images
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

    // Check upload type (image or video)
    const uploadType = request.nextUrl.searchParams.get("type") || "image";
    const isVideo = uploadType === "video";
    const mimePrefix = isVideo ? "video/" : "image/";
    const folder = isVideo ? "videos" : "properties";

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
      if (!file.type.startsWith(mimePrefix)) {
        continue; // Skip files that don't match expected type
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(7);
      const extension = file.name.split(".").pop() || (isVideo ? "mp4" : "jpg");
      const filename = `${folder}/${source.id}/${timestamp}-${randomStr}.${extension}`;

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
      { error: "Failed to upload files" },
      { status: 500 }
    );
  }
}
