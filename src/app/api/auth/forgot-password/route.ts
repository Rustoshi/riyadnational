import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { EmailService } from '@/services/emailService';
import { successResponse, errorResponse, handleError } from '@/lib/apiResponse';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { email, type } = body;

    if (!email) {
      return errorResponse('Email is required', 400);
    }

    if (type === 'admin') {
      await EmailService.sendAdminPasswordResetEmail(email);
    } else {
      await EmailService.sendPasswordResetEmail(email);
    }

    // Always return success to prevent email enumeration
    return successResponse(null, 'If an account exists with this email, a password reset link has been sent');
  } catch (error) {
    return handleError(error);
  }
}
