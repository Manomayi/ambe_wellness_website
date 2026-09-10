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
                  <td style="padding: 28px 32px; background-color: #1A1A1A; text-align: left;">
                    <h1 style="margin: 0; color: #C8996A; font-size: 22px; font-weight: 700; letter-spacing: 1px;">AMBE WELLNESS</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 36px 32px 28px 32px;">
                    <span style="font-size: 11px; font-weight: 700; letter-spacing: 1.5px; color: #E8642E; text-transform: uppercase;">A Clean Living Reference Set</span>
                    <h2 style="margin: 8px 0 16px 0; color: #1A1A1A; font-size: 24px; font-weight: 600; line-height: 1.3;">Your 8 Complimentary Doctor-Curated Guides</h2>
                    <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #353535;">
                      Thank you for your interest in living cleaner, healthier, and with less everyday toxic exposure. Your complete 10-page master guide set is attached directly to this email as a PDF file.
                    </p>
                    
                    <div style="background-color: #FAF8F5; border: 1px solid #EAE5DE; border-radius: 10px; padding: 18px 20px; margin: 24px 0;">
                      <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: 700; color: #C8996A; text-transform: uppercase; letter-spacing: 0.5px;">Guides Included in Your Attachment:</h3>
                      <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8; color: #353535;">
                        <li><strong>Water:</strong> Shower & drinking water filtration priorities</li>
                        <li><strong>Food & Nutrition:</strong> The Healing Kitchen & produce guide</li>
                        <li><strong>Body & Personal Care:</strong> Clean skin, hair, and oral care</li>
                        <li><strong>Home & Environmental Safety:</strong> Cookware, cleaning & air</li>
                        <li><strong>Pets: Safe Nutrition:</strong> Wholesome ingredients & toxins</li>
                        <li><strong>Cleansing & Detox Protocols:</strong> Seasonal Ayurvedic reset</li>
                        <li><strong>Fasting & Autophagy:</strong> Evidence-based renewal routines</li>
                        <li><strong>Pharmaceutical Alternatives:</strong> Natural root-cause support</li>
                      </ul>
                    </div>

                    <div style="margin: 24px 0; padding: 16px 20px; background-color: #FFFDF9; border: 1px dashed #C8996A; border-radius: 10px; text-align: center;">
                      <p style="margin: 0; font-size: 14px; font-weight: 600; color: #1A1A1A;">
                        📎 PDF Attached: <span style="color: #C8996A;">Ambe_Guide_Library_Master_List.pdf</span> (10 Pages)
                      </p>
                      <p style="margin: 6px 0 0 0; font-size: 12px; color: #7A746B;">
                        Check the top or bottom of this email to open or download your attached document.
                      </p>
                    </div>

                    <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #EAE5DE; font-size: 13px; color: #7A746B; line-height: 1.5;">
                      Warm regards,<br>
                      <strong>The Ambe Wellness Medical & Integrative Team</strong><br>
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

Thank you for requesting the Ambé Guide Library!

Your complete 10-page master guide set is attached directly to this email as a PDF (Ambe_Guide_Library_Master_List.pdf).

Included in this reference set:
1. Water: Shower & drinking filtration priorities
2. Food & Nutrition: The Healing Kitchen
3. Body & Personal Care
4. Home & Environmental Safety
5. Pets: Safe Nutrition
6. Cleansing & Detox Protocols
7. Fasting & Autophagy
8. Pharmaceutical Alternatives & Root Support

Warm regards,
The Ambe Wellness Team
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
