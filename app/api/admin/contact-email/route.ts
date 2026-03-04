/**
 * Contact Email Update API Route
 *
 * Allows agents to update their contact email for receiving
 * property inquiries.
 */

import { NextRequest, NextResponse } from "next/server";
import { validateToken, updateSourceContactEmail } from "@/lib/admin";

interface UpdateContactEmailRequest {
  token: string;
  email: string | null;
}

export async function PUT(request: NextRequest) {
  try {
    const body: UpdateContactEmailRequest = await request.json();
    const { token, email } = body;

    // Validate token
    const source = await validateToken(token);
    if (!source) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Update the contact email
    const success = await updateSourceContactEmail(source.id, email);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to update contact email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact email update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
