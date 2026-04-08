import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { PlanService } from '@/services/planService';
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

    if (type === 'available') {
      const plans = await PlanService.getActivePlans();
      return successResponse(plans, 'Available plans retrieved successfully');
    }

    const { userPlans, total } = await PlanService.getUserPlans(user._id.toString());

    return successResponse({ userPlans, total }, 'User plans retrieved successfully');
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
    const { planId, amount } = body;

    if (!planId || !amount) {
      return errorResponse('Plan ID and amount are required', 400);
    }

    const userPlan = await PlanService.subscribeToPlan(
      user._id.toString(),
      planId,
      amount
    );

    return successResponse(userPlan, 'Successfully subscribed to plan', 201);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Insufficient') || error.message.includes('Amount')) {
        return errorResponse(error.message, 400);
      }
    }
    return handleError(error);
  }
}
