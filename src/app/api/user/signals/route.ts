import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { SignalService } from '@/services/signalService';
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

    if (type === 'providers') {
      const providers = await SignalService.getActiveProviders();
      return successResponse(providers, 'Signal providers retrieved successfully');
    }

    if (type === 'signals') {
      const providerId = searchParams.get('providerId');
      if (!providerId) {
        return errorResponse('Provider ID is required', 400);
      }
      
      // Check if user is subscribed
      const isSubscribed = await SignalService.isSubscribed(user._id.toString(), providerId);
      if (!isSubscribed) {
        return errorResponse('You must subscribe to view signals', 403);
      }

      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');
      const { signals, total } = await SignalService.getProviderSignals(providerId, { page, limit });
      return successResponse({ signals, total }, 'Signals retrieved successfully');
    }

    // Default: return user subscriptions
    const subscriptions = await SignalService.getUserSubscriptions(user._id.toString(), {
      activeOnly: searchParams.get('activeOnly') === 'true',
    });
    return successResponse(subscriptions, 'Subscriptions retrieved successfully');
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
    const { providerId, durationDays } = body;

    if (!providerId) {
      return errorResponse('Provider ID is required', 400);
    }

    const subscription = await SignalService.subscribe(
      user._id.toString(),
      providerId,
      durationDays || 30
    );

    return successResponse(subscription, 'Successfully subscribed to signal provider', 201);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Insufficient') || error.message.includes('Already')) {
        return errorResponse(error.message, 400);
      }
    }
    return handleError(error);
  }
}
