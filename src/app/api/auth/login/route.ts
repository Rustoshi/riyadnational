import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { AuthService } from '@/services/authService';
import { loginSchema } from '@/lib/validations';
import { successResponse, errorResponse, handleZodError, handleError } from '@/lib/apiResponse';
import { getClientIp } from '@/lib/auth';
import { ZodError } from 'zod';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const validatedData = loginSchema.parse(body);
    const ipAddress = getClientIp(request);

    const result = await AuthService.login(validatedData, ipAddress);

    return successResponse(result, 'Login successful');
  } catch (error) {
    if (error instanceof ZodError) {
      return handleZodError(error);
    }
    if (error instanceof Error) {
      if (error.message.includes('Invalid email or password')) {
        return errorResponse(error.message, 401);
      }
      if (error.message.includes('blocked') || error.message.includes('suspended')) {
        return errorResponse(error.message, 403);
      }
    }
    return handleError(error);
  }
}
