import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { LoanService } from '@/services/loanService';
import { successResponse, paginatedResponse, unauthorizedResponse, errorResponse, handleError } from '@/lib/apiResponse';
import { authenticateAdmin } from '@/lib/auth';
import { createPaginationResponse } from '@/lib/utils';
import { LoanStatus } from '@/types';

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
    const status = searchParams.get('status') as LoanStatus | undefined;

    const { loans, total } = await LoanService.getAllLoans({ page, limit, status });

    return paginatedResponse(
      loans,
      createPaginationResponse(total, page, limit),
      'Loans retrieved successfully'
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
    const { loanId, action, reason, amount } = body;

    if (!loanId || !action) {
      return errorResponse('Loan ID and action are required', 400);
    }

    let loan;
    switch (action) {
      case 'approve':
        loan = await LoanService.approveLoan(loanId, admin._id.toString());
        break;
      case 'reject':
        loan = await LoanService.rejectLoan(loanId, admin._id.toString(), reason);
        break;
      case 'disburse':
        loan = await LoanService.disburseLoan(loanId, admin._id.toString());
        break;
      case 'recordPayment':
        if (!amount) return errorResponse('Amount is required', 400);
        loan = await LoanService.recordPayment(loanId, amount, admin._id.toString());
        break;
      default:
        return errorResponse('Invalid action', 400);
    }

    return successResponse(loan, `Loan ${action} successful`);
  } catch (error) {
    return handleError(error);
  }
}
