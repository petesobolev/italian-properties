/**
 * Contact Form API Route
 *
 * Sends property inquiry emails to agents via Resend.
 * Emails are sent from info@supersavvytravelers.com with
 * "Referred by Super Savvy Travelers" attribution.
 * Protected by Cloudflare Turnstile CAPTCHA.
 * All submissions are logged to the database for tracking.
 */

import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { queryOne, query } from "@/db";

/**
 * Verify Turnstile CAPTCHA token with Cloudflare
 */
async function verifyTurnstileToken(token: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) {
    console.warn("TURNSTILE_SECRET_KEY not set, skipping verification");
    return true; // Allow through if not configured (for development)
  }

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
      }),
    });

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error("Turnstile verification error:", error);
    return false;
  }
}

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
  turnstileToken?: string;
}

interface SourceInfo {
  name: string;
  contact_email: string | null;
}

interface PropertyInfo {
  listing_url: string;
  city: string;
}

/**
 * Log contact form submission to database
 */
async function logSubmission(params: {
  submitterName: string;
  submitterEmail: string;
  submitterPhone?: string;
  message: string;
  propertyId: string;
  propertyTitle?: string;
  agentEmail: string;
  sourceId: string;
  sourceName: string;
  emailSent: boolean;
  emailError?: string;
}) {
  try {
    await query(
      `INSERT INTO contact_submissions (
        submitter_name,
        submitter_email,
        submitter_phone,
        message,
        property_id,
        property_title,
        agent_email,
        source_id,
        source_name,
        email_sent,
        email_error
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        params.submitterName,
        params.submitterEmail,
        params.submitterPhone || null,
        params.message,
        params.propertyId,
        params.propertyTitle || null,
        params.agentEmail,
        params.sourceId,
        params.sourceName,
        params.emailSent,
        params.emailError || null,
      ]
    );
  } catch (error) {
    // Log but don't fail the request if logging fails
    console.error("Failed to log contact submission:", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: ContactRequest = await request.json();
    const { name, email, phone, message, propertyId, propertyTitle, sourceId, turnstileToken } = body;

    // Verify Turnstile CAPTCHA (if configured)
    if (process.env.TURNSTILE_SECRET_KEY) {
      if (!turnstileToken) {
        return NextResponse.json(
          { error: "CAPTCHA verification required" },
          { status: 400 }
        );
      }

      const isValidToken = await verifyTurnstileToken(turnstileToken);
      if (!isValidToken) {
        return NextResponse.json(
          { error: "CAPTCHA verification failed" },
          { status: 400 }
        );
      }
    }

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
    const { error: emailError } = await getResend().emails.send({
      from: "Italian Properties <info@supersavvytravelers.com>",
      to: source.contact_email,
      replyTo: email,
      subject: `Property Inquiry: ${propertyTitle || "New Inquiry"}`,
      html: emailHtml,
      text: emailText,
    });

    // Log submission to database (regardless of email success)
    await logSubmission({
      submitterName: name,
      submitterEmail: email,
      submitterPhone: phone,
      message,
      propertyId,
      propertyTitle,
      agentEmail: source.contact_email,
      sourceId,
      sourceName: source.name,
      emailSent: !emailError,
      emailError: emailError?.message,
    });

    if (emailError) {
      console.error("Resend error:", emailError);
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
