import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { CopyTradingService } from '@/services/copyTradingService';
import { successResponse, unauthorizedResponse, errorResponse, handleError } from '@/lib/apiResponse';
import { authenticateUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { user, error } = await authenticateUser(request);
    if (error || !user) {
      return unauthorizedResponse(error || 'Unauthorized');
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type === 'traders') {
      const traders = await CopyTradingService.getActiveTraders();
      return successResponse(traders, 'Copy traders retrieved successfully');
    }

    // Default: return user positions
    const positions = await CopyTradingService.getUserPositions(user._id.toString(), {
      activeOnly: searchParams.get('activeOnly') === 'true',
    });
    return successResponse(positions, 'Copy positions retrieved successfully');
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { user, error } = await authenticateUser(request);
    if (error || !user) {
      return unauthorizedResponse(error || 'Unauthorized');
    }

    const body = await request.json();
    const { action, traderId, amount, positionId } = body;

    if (action === 'start') {
      if (!traderId || !amount) {
        return errorResponse('Trader ID and amount are required', 400);
      }
      const position = await CopyTradingService.startCopying(
        user._id.toString(),
        traderId,
        amount
      );
      return successResponse(position, 'Started copying trader successfully', 201);
    }

    if (action === 'stop') {
      if (!positionId) {
        return errorResponse('Position ID is required', 400);
      }
      const position = await CopyTradingService.stopCopying(user._id.toString(), positionId);
      return successResponse(position, 'Stopped copying trader successfully');
    }

    return errorResponse('Invalid action', 400);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Insufficient') || 
          error.message.includes('Minimum') || 
          error.message.includes('Already')) {
        return errorResponse(error.message, 400);
      }
    }
    return handleError(error);
  }
}
