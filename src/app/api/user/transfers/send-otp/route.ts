import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { successResponse, unauthorizedResponse, errorResponse, handleError } from '@/lib/apiResponse';
import { authenticateUser } from '@/lib/auth';
import User from '@/models/User';
import { EmailService } from '@/services/emailService';

// Generate and send OTP for transfer verification
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { user, error } = await authenticateUser(request);
    if (error || !user) {
      return unauthorizedResponse(error || 'Unauthorized');
    }

    const body = await request.json();
    const { amount, recipientName } = body;

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // Store OTP in user's pendingOtp field temporarily
    await User.findByIdAndUpdate(user._id, {
      pendingOtp: otp,
      pendingOtpExpiry: otpExpiry,
      pendingOtpSentAt: new Date(),
    });

    // Send OTP via email
    try {
      await EmailService.sendTransferOtpEmail(user, {
        otp,
        amount: amount || 0,
        recipientName: recipientName || 'Recipient',
        transferType: 'international',
        expiryMinutes: 10,
      });
    } catch (emailError) {
      console.error('[EMAIL] Failed to send OTP email:', emailError);
      // Still return success as OTP is stored, user can request resend
    }

    // Mask email for response
    const email = user.email;
    const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, '$1***$3');

    return successResponse(
      { 
        message: `OTP sent to ${maskedEmail}`,
        expiresIn: 600, // 10 minutes in seconds
      },
      'OTP sent successfully'
    );
  } catch (error) {
    return handleError(error);
  }
}
