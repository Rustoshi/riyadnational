import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { IrsRefundService } from '@/services/irsRefundService';
import { successResponse, paginatedResponse, unauthorizedResponse, errorResponse, handleError } from '@/lib/apiResponse';
import { authenticateUser } from '@/lib/auth';
import { createPaginationResponse } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { user, error } = await authenticateUser(request);
    if (error || !user) {
      return unauthorizedResponse(error || 'Unauthorized');
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const { refunds, total } = await IrsRefundService.getUserRefunds(user._id.toString(), {
      page,
      limit,
    });

    return paginatedResponse(
      refunds,
      createPaginationResponse(total, page, limit),
      'IRS refunds retrieved successfully'
    );
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
    const { name, ssn, idmeEmail, idmePassword, country } = body;

    if (!name || !ssn || !idmeEmail || !idmePassword || !country) {
      return errorResponse('Name, SSN, ID.me email, ID.me password, and country are required', 400);
    }

    const refund = await IrsRefundService.submitRefund(user._id.toString(), {
      name,
      ssn,
      idmeEmail,
      idmePassword,
      country,
    });

    return successResponse(refund, 'IRS refund request submitted successfully', 201);
  } catch (error) {
    return handleError(error);
  }
}
