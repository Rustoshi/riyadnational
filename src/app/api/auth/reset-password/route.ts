import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { EmailService } from '@/services/emailService';
import { successResponse, errorResponse, handleError } from '@/lib/apiResponse';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return errorResponse('Token is required', 400);
    }

    const email = await EmailService.verifyResetToken(token);
    if (!email) {
      return errorResponse('Invalid or expired token', 400);
    }

    return successResponse({ valid: true, email }, 'Token is valid');
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { token, password, type } = body;

    if (!token || !password) {
      return errorResponse('Token and password are required', 400);
    }

    if (password.length < 8) {
      return errorResponse('Password must be at least 8 characters', 400);
    }

    if (type === 'admin') {
      await EmailService.resetAdminPassword(token, password);
    } else {
      await EmailService.resetPassword(token, password);
    }

    return successResponse(null, 'Password has been reset successfully');
  } catch (error) {
    if (error instanceof Error && error.message.includes('Invalid')) {
      return errorResponse(error.message, 400);
    }
    return handleError(error);
  }
}
