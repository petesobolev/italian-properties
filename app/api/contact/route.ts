/**
 * Contact Form API Route
 *
 * Sends property inquiry emails to agents via Resend.
 * Emails are sent from info@supersavvytravelers.com with
 * "Referred by Super Savvy Travelers" attribution.
 */

import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { queryOne } from "@/db";

// Lazy initialization of Resend client
let resend: Resend | null = null;

function getResend(): Resend {
  if (!resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY environment variable is not set");
    }
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

interface ContactRequest {
  name: string;
  email: string;
  phone?: string;
  message: string;
  propertyId: string;
  propertyTitle: string;
  sourceId: string;
}

interface SourceInfo {
  name: string;
  contact_email: string | null;
}

interface PropertyInfo {
  listing_url: string;
  city: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ContactRequest = await request.json();
    const { name, email, phone, message, propertyId, propertyTitle, sourceId } = body;

    // Validate required fields
    if (!name || !email || !message || !propertyId || !sourceId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get source contact email
    const source = await queryOne<SourceInfo>(
      "SELECT name, contact_email FROM sources WHERE id = $1",
      [sourceId]
    );

    if (!source) {
      return NextResponse.json(
        { error: "Source not found" },
        { status: 404 }
      );
    }

    if (!source.contact_email) {
      return NextResponse.json(
        { error: "Agent contact email not configured" },
        { status: 400 }
      );
    }

    // Get property details for the email
    const property = await queryOne<PropertyInfo>(
      "SELECT listing_url, city FROM properties WHERE id = $1",
      [propertyId]
    );

    // Build email content
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #c45d3a;">New Property Inquiry</h2>

        <div style="background: #f9f7f4; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">Property: ${propertyTitle || "Property Inquiry"}</h3>
          ${property?.city ? `<p style="color: #666; margin: 5px 0;">Location: ${property.city}</p>` : ""}
          ${property?.listing_url ? `<p style="margin: 5px 0;"><a href="${property.listing_url}" style="color: #c45d3a;">View Original Listing</a></p>` : ""}
        </div>

        <div style="margin: 20px 0;">
          <h3 style="color: #333;">Contact Details</h3>
          <p style="margin: 5px 0;"><strong>Name:</strong> ${name}</p>
          <p style="margin: 5px 0;"><strong>Email:</strong> <a href="mailto:${email}" style="color: #c45d3a;">${email}</a></p>
          ${phone ? `<p style="margin: 5px 0;"><strong>Phone:</strong> ${phone}</p>` : ""}
        </div>

        <div style="margin: 20px 0;">
          <h3 style="color: #333;">Message</h3>
          <div style="background: #fff; padding: 15px; border: 1px solid #e5e2dd; border-radius: 8px;">
            <p style="margin: 0; white-space: pre-wrap;">${message}</p>
          </div>
        </div>

        <hr style="border: none; border-top: 1px solid #e5e2dd; margin: 30px 0;" />

        <p style="color: #999; font-size: 12px; text-align: center;">
          Referred by <a href="https://supersavvytravelers.com" style="color: #c45d3a;">Super Savvy Travelers</a>
        </p>
      </div>
    `;

    const emailText = `
New Property Inquiry

Property: ${propertyTitle || "Property Inquiry"}
${property?.city ? `Location: ${property.city}` : ""}
${property?.listing_url ? `View Listing: ${property.listing_url}` : ""}

Contact Details
---------------
Name: ${name}
Email: ${email}
${phone ? `Phone: ${phone}` : ""}

Message
-------
${message}

---
Referred by Super Savvy Travelers
https://supersavvytravelers.com
    `.trim();

    // Send email via Resend
    const { error } = await getResend().emails.send({
      from: "Italian Properties <info@supersavvytravelers.com>",
      to: source.contact_email,
      replyTo: email,
      subject: `Property Inquiry: ${propertyTitle || "New Inquiry"}`,
      html: emailHtml,
      text: emailText,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
