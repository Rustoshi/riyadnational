import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { SignalService } from '@/services/signalService';
import { successResponse, unauthorizedResponse, errorResponse, handleError } from '@/lib/apiResponse';
import { authenticateAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { admin, error } = await authenticateAdmin(request);
    if (error || !admin) {
      return unauthorizedResponse(error || 'Unauthorized');
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const providerId = searchParams.get('providerId');

    if (type === 'signals' && providerId) {
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');
      const { signals, total } = await SignalService.getProviderSignals(providerId, { page, limit });
      return successResponse({ signals, total }, 'Signals retrieved successfully');
    }

    const providers = await SignalService.getActiveProviders();
    return successResponse(providers, 'Signal providers retrieved successfully');
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
    const { type, providerId, ...data } = body;

    if (type === 'signal') {
      if (!providerId) {
        return errorResponse('Provider ID is required', 400);
      }
      const { asset, action, entryPrice, takeProfit, stopLoss } = data;
      if (!asset || !action || !entryPrice || !takeProfit || !stopLoss) {
        return errorResponse('All signal details are required', 400);
      }
      const signal = await SignalService.createSignal(
        providerId,
        { asset, action, entryPrice, takeProfit, stopLoss },
        admin._id.toString()
      );
      return successResponse(signal, 'Signal created successfully', 201);
    }

    const { name, description, avatar, subscriptionFee } = data;
    if (!name || subscriptionFee === undefined) {
      return errorResponse('Name and subscription fee are required', 400);
    }

    const provider = await SignalService.createProvider(
      { name, description, avatar, subscriptionFee },
      admin._id.toString()
    );
    return successResponse(provider, 'Signal provider created successfully', 201);
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
    const { signalId, result, profitLoss } = body;

    if (!signalId || !result) {
      return errorResponse('Signal ID and result are required', 400);
    }

    const signal = await SignalService.closeSignal(
      signalId,
      result,
      profitLoss || 0,
      admin._id.toString()
    );
    return successResponse(signal, 'Signal closed successfully');
  } catch (error) {
    return handleError(error);
  }
}
