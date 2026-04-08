import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { UserService } from '@/services/userService';
import { successResponse, errorResponse, unauthorizedResponse, handleError } from '@/lib/apiResponse';
import { authenticateUser } from '@/lib/auth';
import { comparePassword } from '@/lib/utils';

export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const { user, error } = await authenticateUser(request);
    if (error || !user) {
      return unauthorizedResponse(error || 'Unauthorized');
    }

    const body = await request.json();
    const { currentPassword, newPin } = body;

    if (!currentPassword || !newPin) {
      return errorResponse('Current password and new PIN are required', 400);
    }

    if (newPin.length < 4) {
      return errorResponse('PIN must be at least 4 characters', 400);
    }

    // Verify current password
    const isPasswordValid = await comparePassword(currentPassword, user.password);
    if (!isPasswordValid) {
      return errorResponse('Current password is incorrect', 400);
    }

    // Update PIN (passing undefined for currentPin since we verified password)
    await UserService.changePin(user._id.toString(), undefined, newPin);

    return successResponse(null, 'Transaction PIN updated successfully');
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, 400);
    }
    return handleError(error);
  }
}
