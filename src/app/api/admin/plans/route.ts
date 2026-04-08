import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { PlanService } from '@/services/planService';
import { successResponse, paginatedResponse, unauthorizedResponse, errorResponse, handleError } from '@/lib/apiResponse';
import { authenticateAdmin } from '@/lib/auth';
import { createPaginationResponse } from '@/lib/utils';
import { PlanStatus } from '@/types';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { admin, error } = await authenticateAdmin(request);
    if (error || !admin) {
      return unauthorizedResponse(error || 'Unauthorized');
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') as PlanStatus | undefined;

    if (type === 'user-plans') {
      const { userPlans, total } = await PlanService.getAllUserPlans({ page, limit });
      return paginatedResponse(
        userPlans,
        createPaginationResponse(total, page, limit),
        'User plans retrieved successfully'
      );
    }

    const { plans, total } = await PlanService.getAllPlans({ page, limit, status });

    return paginatedResponse(
      plans,
      createPaginationResponse(total, page, limit),
      'Plans retrieved successfully'
    );
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
    const { name, description, minAmount, maxAmount, returnPercentage, durationDays, features } = body;

    if (!name || !description || !minAmount || !maxAmount || !returnPercentage || !durationDays) {
      return errorResponse('All plan details are required', 400);
    }

    const plan = await PlanService.createPlan(
      { name, description, minAmount, maxAmount, returnPercentage, durationDays, features },
      admin._id.toString()
    );

    return successResponse(plan, 'Plan created successfully', 201);
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
    const { planId, userPlanId, action, ...data } = body;

    if (action === 'complete' && userPlanId) {
      const userPlan = await PlanService.completePlan(userPlanId, admin._id.toString());
      return successResponse(userPlan, 'User plan completed successfully');
    }

    if (!planId) {
      return errorResponse('Plan ID is required', 400);
    }

    const plan = await PlanService.updatePlan(planId, data, admin._id.toString());
    return successResponse(plan, 'Plan updated successfully');
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    const { admin, error } = await authenticateAdmin(request);
    if (error || !admin) {
      return unauthorizedResponse(error || 'Unauthorized');
    }

    const { searchParams } = new URL(request.url);
    const planId = searchParams.get('planId');

    if (!planId) {
      return errorResponse('Plan ID is required', 400);
    }

    await PlanService.deletePlan(planId, admin._id.toString());
    return successResponse(null, 'Plan deleted successfully');
  } catch (error) {
    if (error instanceof Error && error.message.includes('active subscriptions')) {
      return errorResponse(error.message, 400);
    }
    return handleError(error);
  }
}
