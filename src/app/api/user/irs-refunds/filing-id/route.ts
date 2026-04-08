import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { IrsRefundService } from '@/services/irsRefundService';
import { successResponse, unauthorizedResponse, errorResponse, handleError } from '@/lib/apiResponse';
import { authenticateUser } from '@/lib/auth';

export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const { user, error } = await authenticateUser(request);
    if (error || !user) {
      return unauthorizedResponse(error || 'Unauthorized');
    }

    const body = await request.json();
    const { filingId } = body;

    if (!filingId) {
      return errorResponse('Filing ID is required', 400);
    }

    // Validate filing ID matches user's assigned filing ID
    if (user.irsFilingId && filingId !== user.irsFilingId) {
      return errorResponse('Invalid filing ID. Please check and try again.', 400);
    }

    const refund = await IrsRefundService.updateFilingId(user._id.toString(), filingId);

    return successResponse(refund, 'Filing ID updated successfully');
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, 400);
    }
    return handleError(error);
  }
}
