import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models';
import { successResponse, unauthorizedResponse, errorResponse, handleError } from '@/lib/apiResponse';
import { authenticateAdmin } from '@/lib/auth';
import { sendEmail } from '@/lib/email';

// Helper to create email HTML template
function createEmailHtml(userName: string, message: string, siteName: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <tr>
                <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #0369a1 0%, #0284c7 100%); border-radius: 12px 12px 0 0;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">${siteName}</h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 40px;">
                  <p style="margin: 0 0 20px; color: #1f2937; font-size: 16px;">Dear <strong>${userName}</strong>,</p>
                  <div style="margin: 0 0 20px; color: #4b5563; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${message}</div>
                  <p style="margin: 30px 0 0; color: #4b5563; font-size: 15px;">
                    Best regards,<br>
                    <strong>${siteName} Support Team</strong>
                  </p>
                </td>
              </tr>
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
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { admin, error } = await authenticateAdmin(request);
    if (error || !admin) {
      return unauthorizedResponse(error || 'Unauthorized');
    }

    const body = await request.json();
    const { type, to, userIds, subject, message, filter } = body;

    if (!subject || !message) {
      return errorResponse('Subject and message are required', 400);
    }

    // Get site settings
    const fromEmail = process.env.EMAIL_FROM || 'noreply@example.com';
    const fromName = process.env.EMAIL_FROM_NAME || process.env.SITE_NAME || 'Online Banking';
    const siteName = process.env.SITE_NAME || 'Online Banking';

    let sentCount = 0;
    let failedCount = 0;

    if (type === 'single') {
      // Find user by email or ID
      let user;
      if (to.includes('@')) {
        user = await User.findOne({ email: to.toLowerCase() });
      } else {
        user = await User.findById(to);
      }
      
      if (!user) {
        return errorResponse('User not found', 404);
      }

      const html = createEmailHtml(user.name, message, siteName);
      const result = await sendEmail({
        to: user.email,
        subject,
        html,
        from: `${fromName} <${fromEmail}>`,
      });

      if (result.success) {
        sentCount = 1;
        console.log(`[Admin Email] Sent to ${user.email} by admin ${admin.email}`);
      } else {
        return errorResponse(result.error || 'Failed to send email', 500);
      }
      
      return successResponse({ sentCount }, 'Email sent successfully');
    }

    if (type === 'multiple') {
      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return errorResponse('User IDs are required', 400);
      }

      const users = await User.find({ _id: { $in: userIds } });
      
      for (const user of users) {
        const html = createEmailHtml(user.name, message, siteName);
        const result = await sendEmail({
          to: user.email,
          subject,
          html,
          from: `${fromName} <${fromEmail}>`,
        });
        
        if (result.success) {
          sentCount++;
        } else {
          failedCount++;
        }
      }

      console.log(`[Admin Email] Sent to ${sentCount} users by admin ${admin.email}`);
      return successResponse({ sentCount, failedCount }, `Email sent to ${sentCount} users`);
    }

    if (type === 'all') {
      const users = await User.find({}, 'email name');
      
      for (const user of users) {
        const html = createEmailHtml(user.name, message, siteName);
        const result = await sendEmail({
          to: user.email,
          subject,
          html,
          from: `${fromName} <${fromEmail}>`,
        });
        
        if (result.success) {
          sentCount++;
        } else {
          failedCount++;
        }
      }

      console.log(`[Admin Email] Sent to all ${sentCount} users by admin ${admin.email}`);
      return successResponse({ sentCount, failedCount }, `Email sent to ${sentCount} users`);
    }

    if (type === 'filtered') {
      // Build query based on filter
      const query: Record<string, unknown> = {};
      
      if (filter === 'active') query.status = 'active';
      else if (filter === 'inactive') query.status = 'inactive';
      else if (filter === 'verified') query.emailVerified = true;
      else if (filter === 'unverified') query.emailVerified = false;
      else if (filter === 'blocked') query.status = 'blocked';
      else if (filter === 'suspended') query.status = 'suspended';

      const users = await User.find(query, 'email name');
      
      if (users.length === 0) {
        return errorResponse('No users match the filter criteria', 400);
      }

      for (const user of users) {
        const html = createEmailHtml(user.name, message, siteName);
        const result = await sendEmail({
          to: user.email,
          subject,
          html,
          from: `${fromName} <${fromEmail}>`,
        });
        
        if (result.success) {
          sentCount++;
        } else {
          failedCount++;
        }
      }

      console.log(`[Admin Email] Sent to ${sentCount} filtered users by admin ${admin.email}`);
      return successResponse({ sentCount, failedCount }, `Email sent to ${sentCount} users`);
    }

    return errorResponse('Invalid email type', 400);
  } catch (error) {
    return handleError(error);
  }
}
