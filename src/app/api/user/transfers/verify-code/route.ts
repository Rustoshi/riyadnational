import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { successResponse, errorResponse, unauthorizedResponse, handleError } from '@/lib/apiResponse';
import { authenticateUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { user, error } = await authenticateUser(request);
    if (error || !user) {
      return unauthorizedResponse(error || 'Unauthorized');
    }

    const body = await request.json();
    const { step, code } = body;

    if (!step || !code) {
      return errorResponse('Step and code are required', 400);
    }

    // Get user with IMF, COT codes and pending OTP
    const fullUser = await User.findById(user._id).select('+imfCode +cotCode +pendingOtp +pendingOtpExpiry');
    if (!fullUser) {
      return errorResponse('User not found', 404);
    }

    switch (step) {
      case 'imf':
        // Verify IMF Code against user's stored code
        if (!fullUser.imfCode) {
          return errorResponse('IMF Code not set. Please contact support.', 400);
        }
        if (code !== fullUser.imfCode) {
          return errorResponse('Invalid IMF Code. Please check and try again.', 400);
        }
        return successResponse({ verified: true, nextStep: 'cot' }, 'IMF Code verified successfully');

      case 'cot':
        // Verify COT Code against user's stored code
        if (!fullUser.cotCode) {
          return errorResponse('COT Code not set. Please contact support.', 400);
        }
        if (code !== fullUser.cotCode) {
          return errorResponse('Invalid COT Code. Please check and try again.', 400);
        }
        return successResponse({ verified: true, nextStep: 'otp' }, 'COT Code verified successfully');

      case 'otp':
        // Verify OTP against user's pending OTP
        const storedOtp = fullUser.pendingOtp as string | undefined;
        const otpExpiry = fullUser.pendingOtpExpiry as Date | undefined;
        
        if (!storedOtp || !otpExpiry) {
          return errorResponse('OTP not found. Please request a new OTP.', 400);
        }
        
        if (new Date() > new Date(otpExpiry)) {
          return errorResponse('OTP has expired. Please request a new OTP.', 400);
        }
        
        if (code !== storedOtp) {
          return errorResponse('Invalid OTP. Please check and try again.', 400);
        }
        
        // Clear the pending OTP after successful verification
        await User.findByIdAndUpdate(user._id, {
          $unset: { pendingOtp: 1, pendingOtpExpiry: 1, pendingOtpSentAt: 1 }
        });
        
        return successResponse({ verified: true, nextStep: 'complete' }, 'OTP verified successfully');

      default:
        return errorResponse('Invalid verification step', 400);
    }
  } catch (error) {
    return handleError(error);
  }
}
