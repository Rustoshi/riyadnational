import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { UserService } from '@/services/userService';
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
    const { pin } = body;

    if (!pin) {
      return errorResponse('PIN is required', 400);
    }

    // Verify PIN
    const isValid = await UserService.verifyPin(user._id.toString(), pin);
    if (!isValid) {
      return errorResponse('Invalid PIN', 400);
    }

    return successResponse({ verified: true }, 'PIN verified successfully');
  } catch (error) {
    return handleError(error);
  }
}
