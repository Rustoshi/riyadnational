import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { CardService } from '@/services/cardService';
import { successResponse, unauthorizedResponse, handleError } from '@/lib/apiResponse';
import { authenticateUser } from '@/lib/auth';

export async function POST(
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
    const card = await CardService.activateCard(id, user._id.toString());

    return successResponse(card, 'Card activated successfully');
  } catch (error) {
    return handleError(error);
  }
}
