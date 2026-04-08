import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { CopyTradingService } from '@/services/copyTradingService';
import { successResponse, unauthorizedResponse, errorResponse, handleError } from '@/lib/apiResponse';
import { authenticateAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { admin, error } = await authenticateAdmin(request);
    if (error || !admin) {
      return unauthorizedResponse(error || 'Unauthorized');
    }

    const traders = await CopyTradingService.getActiveTraders();
    return successResponse(traders, 'Copy traders retrieved successfully');
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { admin, error } = await authenticateAdmin(request);
    if (error || !admin) {
      return unauthorizedResponse(error || 'Unauthorized');
    }

    const body = await request.json();
    const { name, description, avatar, minInvestment, profitShare } = body;

    if (!name || minInvestment === undefined || profitShare === undefined) {
      return errorResponse('Name, minimum investment, and profit share are required', 400);
    }

    const trader = await CopyTradingService.createTrader(
      { name, description, avatar, minInvestment, profitShare },
      admin._id.toString()
    );
    return successResponse(trader, 'Copy trader created successfully', 201);
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
    const { traderId, totalProfit, winRate, totalTrades } = body;

    if (!traderId) {
      return errorResponse('Trader ID is required', 400);
    }

    const trader = await CopyTradingService.updateTraderStats(
      traderId,
      { totalProfit, winRate, totalTrades },
      admin._id.toString()
    );
    return successResponse(trader, 'Copy trader stats updated successfully');
  } catch (error) {
    return handleError(error);
  }
}
