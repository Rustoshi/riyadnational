import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { LoanService } from '@/services/loanService';
import { successResponse, paginatedResponse, unauthorizedResponse, errorResponse, handleError } from '@/lib/apiResponse';
import { authenticateUser } from '@/lib/auth';
import { createPaginationResponse } from '@/lib/utils';
import { LoanStatus } from '@/types';

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
    const status = searchParams.get('status') as LoanStatus | undefined;

    const { loans, total } = await LoanService.getUserLoans(user._id.toString(), {
      page,
      limit,
      status,
    });

    return paginatedResponse(
      loans,
      createPaginationResponse(total, page, limit),
      'Loans retrieved successfully'
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
    const { amount, durationMonths, purpose } = body;

    if (!amount || !durationMonths || !purpose) {
      return errorResponse('Amount, duration, and purpose are required', 400);
    }

    const loan = await LoanService.applyLoan(user._id.toString(), {
      amount,
      durationMonths,
      purpose,
    });

    return successResponse(loan, 'Loan application submitted successfully', 201);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('KYC') || error.message.includes('already have')) {
        return errorResponse(error.message, 400);
      }
    }
    return handleError(error);
  }
}
