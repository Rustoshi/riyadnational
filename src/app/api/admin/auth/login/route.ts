import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { AuthService } from '@/services/authService';
import { adminLoginSchema } from '@/lib/validations';
import { successResponse, errorResponse, handleZodError, handleError } from '@/lib/apiResponse';
import { getClientIp } from '@/lib/auth';
import { ZodError } from 'zod';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    console.log('[Admin Login] Attempting login for:', body.email);
    
    const validatedData = adminLoginSchema.parse(body);
    const ipAddress = getClientIp(request);

    const result = await AuthService.adminLogin(validatedData, ipAddress);
    console.log('[Admin Login] Success for:', body.email);

    return successResponse(result, 'Admin login successful');
  } catch (error) {
    console.log('[Admin Login] Error:', error instanceof Error ? error.message : error);
    if (error instanceof ZodError) {
      return handleZodError(error);
    }
    if (error instanceof Error) {
      if (error.message.includes('Invalid email or password')) {
        return errorResponse(error.message, 401);
      }
      if (error.message.includes('blocked')) {
        return errorResponse(error.message, 403);
      }
    }
    return handleError(error);
  }
}
