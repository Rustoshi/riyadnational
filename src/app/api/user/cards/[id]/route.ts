import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { CardService } from '@/services/cardService';
import { successResponse, unauthorizedResponse, errorResponse, handleError } from '@/lib/apiResponse';
import { authenticateUser } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { user, error } = await authenticateUser(request);
    if (error || !user) {
      return unauthorizedResponse(error || 'Unauthorized');
    }

    const { id } = await params;
    const card = await CardService.getCardById(id);

    if (!card) {
      return errorResponse('Card not found', 404);
    }

    // Verify card belongs to user
    if (card.user.toString() !== user._id.toString()) {
      return errorResponse('Card not found', 404);
    }

    return successResponse(card, 'Card retrieved successfully');
  } catch (error) {
    return handleError(error);
  }
}
