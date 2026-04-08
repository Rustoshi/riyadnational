import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { AuthService } from '@/services/authService';
import { successResponse, errorResponse, unauthorizedResponse, handleError } from '@/lib/apiResponse';
import { authenticateUser } from '@/lib/auth';

export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const { user, error } = await authenticateUser(request);
    if (error || !user) {
      return unauthorizedResponse(error || 'Unauthorized');
    }

    const body = await request.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return errorResponse('Current password, new password, and confirmation are required', 400);
    }

    if (newPassword !== confirmPassword) {
      return errorResponse('New password and confirmation do not match', 400);
    }

    if (newPassword.length < 6) {
      return errorResponse('Password must be at least 6 characters', 400);
    }

    await AuthService.changePassword(user._id.toString(), currentPassword, newPassword);

    return successResponse(null, 'Password updated successfully');
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('incorrect') || error.message.includes('match')) {
        return errorResponse(error.message, 400);
      }
    }
    return handleError(error);
  }
}
