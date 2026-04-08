import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { successResponse, unauthorizedResponse, notFoundResponse, errorResponse, handleError } from '@/lib/apiResponse';
import { authenticateAdmin } from '@/lib/auth';
import { User } from '@/models';
import { sendEmail } from '@/lib/email';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { admin, error } = await authenticateAdmin(request);
    if (error || !admin) {
      return unauthorizedResponse(error || 'Unauthorized');
    }

    const { id } = await params;
    const body = await request.json();
    const { subject, message } = body;

    if (!subject || !message) {
      return errorResponse('Subject and message are required', 400);
    }

    const user = await User.findById(id);
    if (!user) {
      return notFoundResponse('User not found');
    }

    // Get site domain from environment or default
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const domain = new URL(siteUrl).hostname;
    const fromEmail = `support@${domain}`;
    const siteName = process.env.SITE_NAME || 'Online Banking';

    // Create HTML email template
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <tr>
                  <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #0369a1 0%, #0284c7 100%); border-radius: 12px 12px 0 0;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">${siteName}</h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <p style="margin: 0 0 20px; color: #1f2937; font-size: 16px;">Dear <strong>${user.name}</strong>,</p>
                    
                    <div style="margin: 0 0 20px; color: #4b5563; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">
${message}
                    </div>
                    
                    <p style="margin: 30px 0 0; color: #4b5563; font-size: 15px;">
                      Best regards,<br>
                      <strong>${siteName} Support Team</strong>
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0; color: #6b7280; font-size: 13px; text-align: center;">
                      This email was sent from ${siteName}.<br>
                      If you have any questions, please contact our support team.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // Send the email
    const result = await sendEmail({
      to: user.email,
      subject,
      html,
      from: `${siteName} Support <${fromEmail}>`,
    });

    if (!result.success) {
      console.error('[Admin Email] Failed to send:', result.error);
      return errorResponse(result.error || 'Failed to send email', 500);
    }

    console.log(`[Admin Email] Sent to ${user.email} by admin ${admin.email}`);

    return successResponse(
      { messageId: result.messageId },
      'Email sent successfully'
    );
  } catch (error) {
    return handleError(error);
  }
}
