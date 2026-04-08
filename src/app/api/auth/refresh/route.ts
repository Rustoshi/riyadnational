import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { AuthService } from '@/services/authService';
import { successResponse, errorResponse, handleError } from '@/lib/apiResponse';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return errorResponse('Refresh token is required', 400);
    }

    const result = await AuthService.refreshToken(refreshToken);

    return successResponse(result, 'Token refreshed successfully');
  } catch (error) {
    if (error instanceof Error && error.message.includes('Invalid')) {
      return errorResponse(error.message, 401);
    }
    return handleError(error);
  }
}
