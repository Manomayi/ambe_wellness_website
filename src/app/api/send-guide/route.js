import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const SENDER_EMAIL = process.env.SENDGRID_FROM_EMAIL || "info@ambewellness.com";
const SENDER_NAME = process.env.SENDGRID_FROM_NAME || "Ambe Wellness";

export async function POST(request) {
  try {
    const { email, guideTitle } = await request.json().catch(() => ({}));

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "A valid email address is required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const apiKey = (process.env.SENDGRID_API_KEY || "").trim();

    // If SendGrid key is not directly in Next.js environment, instruct client to use Cloud Function
    if (!apiKey) {
      console.log(`[api/send-guide] SENDGRID_API_KEY not in Next.js env, deferring to Cloud Function for ${normalizedEmail}`);
      return NextResponse.json({
        success: false,
        useCloudFunction: true,
        message: "No local SendGrid key configured in Next.js",
      });
    }

    // Read PDF attachment from private src/assets
    let pdfBase64 = null;
    const possiblePaths = [
      path.join(process.cwd(), "src", "assets", "Ambe_Guide_Library_Master_List.pdf"),
      path.join(process.cwd(), "assets", "Ambe_Guide_Library_Master_List.pdf"),
      path.resolve(process.cwd(), "../current-flutter-mobile-app-6-12/functions/assets/Ambe_Guide_Library_Master_List.pdf"),
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        try {
          pdfBase64 = fs.readFileSync(p).toString("base64");
          break;
        } catch (_) {}
      }
    }

    const attachments = pdfBase64
      ? [
          {
            content: pdfBase64,
            filename: "Ambe_Guide_Library_Master_List.pdf",
            type: "application/pdf",
            disposition: "attachment",
          },
        ]
      : [];

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Your Complimentary Ambé Wellness Guides</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #FAF8F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #FAF8F5; padding: 32px 16px;">
          <tr>
            <td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 16px; border: 1px solid #EAE5DE; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
                <tr>
                  <td style="padding: 24px 32px; background-color: #1A1A1A; text-align: left;">
                    <a href="https://ambewellness.com" target="_blank" style="text-decoration: none; display: inline-block;">
                      <img src="https://ambewellness.com/images/logos/ambe_logo.png" alt="Ambé Wellness" height="32" style="height: 32px; max-height: 32px; width: auto; display: block; border: 0;" />
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 36px 32px 28px 32px;">
                    <h2 style="margin: 0 0 16px 0; color: #1A1A1A; font-size: 22px; font-weight: 600; line-height: 1.3;">Your Complimentary Ambé Wellness Guides</h2>
                    <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #353535;">
                      Thank you for your interest in Ambé Wellness. We are delighted to share our doctor-curated Clean Living Guide set with you.
                    </p>
                    <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #353535;">
                      Your complimentary 8-guide PDF is attached to this email below.
                    </p>

                    <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #EAE5DE; font-size: 13px; color: #7A746B; line-height: 1.5;">
                      Warm regards,<br>
                      <strong>The Ambé Wellness Medical & Integrative Team</strong><br>
                      <a href="https://ambewellness.com" style="color: #C8996A; text-decoration: none;">ambewellness.com</a> • <a href="mailto:info@ambewellness.com" style="color: #C8996A; text-decoration: none;">info@ambewellness.com</a>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px 32px 24px 32px; background-color: #FAF8F5; text-align: center; font-size: 12px; color: #9A948B; border-top: 1px solid #EAE5DE;">
                    © ${new Date().getFullYear()} Ambe Wellness. All rights reserved.<br>
                    <span style="font-size: 11px;">You received this email because you requested the complimentary Ambé Guide Library.</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const textContent = `Your Complimentary Ambé Wellness Guides (PDF)

Thank you for your interest in Ambé Wellness. We are delighted to share our doctor-curated Clean Living Guide set with you.

Your complimentary 8-guide PDF is attached to this email below.

Warm regards,
The Ambé Wellness Medical & Integrative Team
info@ambewellness.com | ambewellness.com
`;

    const payload = {
      personalizations: [
        {
          to: [{ email: normalizedEmail }],
        },
      ],
      from: {
        email: SENDER_EMAIL,
        name: SENDER_NAME,
      },
      subject: "Your Complimentary Ambé Wellness Guides (PDF)",
      content: [
        {
          type: "text/plain",
          value: textContent,
        },
        {
          type: "text/html",
          value: htmlContent,
        },
      ],
      ...(attachments.length > 0 ? { attachments } : {}),
    };

    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (res.status >= 200 && res.status < 300) {
      console.log(`✅ [api/send-guide] Email sent successfully to ${normalizedEmail}`);
      return NextResponse.json({ success: true, message: "Email sent successfully" });
    } else {
      const errorText = await res.text();
      console.error(`❌ [api/send-guide] SendGrid failed (${res.status}):`, errorText);
      return NextResponse.json({
        success: false,
        useCloudFunction: true,
        error: errorText,
      });
    }
  } catch (err) {
    console.error("Error in /api/send-guide route:", err);
    return NextResponse.json(
      { success: false, useCloudFunction: true, error: err.message },
      { status: 500 }
    );
  }
}
