import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { EmailService } from '@/services/emailService';
import { successResponse, unauthorizedResponse, errorResponse, handleError } from '@/lib/apiResponse';
import { authenticateUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { user, error } = await authenticateUser(request);
    if (error || !user) {
      return unauthorizedResponse(error || 'Unauthorized');
    }

    // Send verification email
    const result = await EmailService.sendVerificationEmail(user._id.toString());

    return successResponse(result, 'Verification email sent');
  } catch (error) {
    if (error instanceof Error && error.message.includes('already verified')) {
      return errorResponse(error.message, 400);
    }
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { user, error } = await authenticateUser(request);
    if (error || !user) {
      return unauthorizedResponse(error || 'Unauthorized');
    }

    // In production, verify token from email link
    // For now, just verify the user
    await EmailService.verifyEmail(user._id.toString());

    return successResponse(null, 'Email verified successfully');
  } catch (error) {
    return handleError(error);
  }
}
