import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { UserService } from '@/services/userService';
import { AuthService } from '@/services/authService';
import { updateProfileSchema, changePasswordSchema, changePinSchema, updateSettingsSchema } from '@/lib/validations';
import { successResponse, errorResponse, unauthorizedResponse, handleZodError, handleError } from '@/lib/apiResponse';
import { authenticateUser } from '@/lib/auth';
import { sanitizeUser } from '@/lib/utils';
import { ZodError } from 'zod';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { user, error } = await authenticateUser(request);
    if (error || !user) {
      return unauthorizedResponse(error || 'Unauthorized');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return successResponse(sanitizeUser((user as any).toObject()), 'Profile retrieved successfully');
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const { user, error } = await authenticateUser(request);
    if (error || !user) {
      return unauthorizedResponse(error || 'Unauthorized');
    }

    const body = await request.json();
    const validatedData = updateProfileSchema.parse(body);

    const updatedUser = await UserService.updateProfile(user._id.toString(), validatedData);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return successResponse(sanitizeUser((updatedUser as any).toObject()), 'Profile updated successfully');
  } catch (error) {
    if (error instanceof ZodError) {
      return handleZodError(error);
    }
    return handleError(error);
  }
}
