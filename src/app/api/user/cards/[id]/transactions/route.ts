import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { CardService } from '@/services/cardService';
import { successResponse, unauthorizedResponse, handleError } from '@/lib/apiResponse';
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const { id } = await params;
    const result = await CardService.getCardTransactions(id, user._id.toString(), {
      page,
      limit,
    });

    return successResponse(result, 'Card transactions retrieved successfully');
  } catch (error) {
    return handleError(error);
  }
}
