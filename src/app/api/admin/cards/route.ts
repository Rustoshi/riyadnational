import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { CardService } from '@/services/cardService';
import { successResponse, paginatedResponse, unauthorizedResponse, errorResponse, handleError } from '@/lib/apiResponse';
import { authenticateAdmin } from '@/lib/auth';
import { createPaginationResponse } from '@/lib/utils';
import { CardStatus } from '@/types';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { admin, error } = await authenticateAdmin(request);
    if (error || !admin) {
      return unauthorizedResponse(error || 'Unauthorized');
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') as CardStatus | undefined;

    const { cards, total } = await CardService.getAllCards({ page, limit, status });

    return paginatedResponse(
      cards,
      createPaginationResponse(total, page, limit),
      'Cards retrieved successfully'
    );
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const { admin, error } = await authenticateAdmin(request);
    if (error || !admin) {
      return unauthorizedResponse(error || 'Unauthorized');
    }

    const body = await request.json();
    const { cardId, action, amount, reason } = body;

    if (!cardId || !action) {
      return errorResponse('Card ID and action are required', 400);
    }

    let card;
    switch (action) {
      case 'approve':
        card = await CardService.approveCard(cardId, admin._id.toString());
        break;
      case 'reject':
        card = await CardService.rejectCard(cardId, admin._id.toString(), reason);
        break;
      case 'block':
        card = await CardService.adminBlockCard(cardId, admin._id.toString());
        break;
      case 'unblock':
        card = await CardService.adminUnblockCard(cardId, admin._id.toString());
        break;
      case 'topup':
        if (!amount) return errorResponse('Amount is required', 400);
        card = await CardService.topupCard(cardId, amount, admin._id.toString());
        break;
      case 'deduct':
        if (!amount) return errorResponse('Amount is required', 400);
        card = await CardService.deductCard(cardId, amount, admin._id.toString(), reason);
        break;
      default:
        return errorResponse('Invalid action', 400);
    }

    return successResponse(card, `Card ${action} successful`);
  } catch (error) {
    return handleError(error);
  }
}
