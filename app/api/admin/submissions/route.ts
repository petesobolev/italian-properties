/**
 * Contact Submissions API
 *
 * Returns contact form submissions for the authenticated source.
 */

import { NextRequest, NextResponse } from "next/server";
import { validateToken } from "@/lib/admin";
import { queryAll } from "@/db";

interface ContactSubmission {
  id: string;
  submitter_name: string;
  submitter_email: string;
  submitter_phone: string | null;
  message: string;
  property_id: string;
  property_title: string | null;
  agent_email: string;
  source_name: string;
  created_at: string;
  email_sent: boolean;
  email_error: string | null;
}

export async function GET(request: NextRequest) {
  try {
    // Get and validate admin token
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

    // Fetch submissions for this source
    const submissions = await queryAll<ContactSubmission>(
      `SELECT
        id,
        submitter_name,
        submitter_email,
        submitter_phone,
        message,
        property_id,
        property_title,
        agent_email,
        source_name,
        created_at,
        email_sent,
        email_error
      FROM contact_submissions
      WHERE source_id = $1
      ORDER BY created_at DESC`,
      [source.id]
    );

    return NextResponse.json({ submissions });
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 }
    );
  }
}
