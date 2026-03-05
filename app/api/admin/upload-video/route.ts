/**
 * Video Upload API (Client-Side Upload)
 *
 * Handles large video uploads using Vercel Blob's client-side upload feature.
 * This bypasses the 4.5MB serverless function body size limit.
 *
 * Uses handleUpload to generate pre-signed URLs for direct browser-to-blob uploads.
 */

import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextRequest, NextResponse } from "next/server";
import { validateToken } from "@/lib/admin";

// Allow longer duration for the upload coordination
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // Extract and validate admin token from client payload
        if (!clientPayload) {
          throw new Error("Missing authentication");
        }

        const { token } = JSON.parse(clientPayload);
        if (!token) {
          throw new Error("Missing authentication token");
        }

        const source = await validateToken(token);
        if (!source) {
          throw new Error("Invalid authentication token");
        }

        return {
          allowedContentTypes: [
            "video/mp4",
            "video/webm",
            "video/quicktime",
            "video/x-msvideo",
            "video/x-ms-wmv",
            "video/mpeg",
            "video/ogg",
          ],
          maximumSizeInBytes: 500 * 1024 * 1024, // 500MB max
          tokenPayload: JSON.stringify({
            sourceId: source.id,
          }),
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.log("Video upload completed:", blob.url);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("Video upload error:", error);
    const message = error instanceof Error ? error.message : "Failed to process upload";
    return NextResponse.json(
      { error: message },
      { status: error instanceof Error && error.message.includes("authentication") ? 401 : 500 }
    );
  }
}
