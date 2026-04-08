import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { LoanService } from '@/services/loanService';
import { successResponse, unauthorizedResponse, errorResponse, handleError } from '@/lib/apiResponse';
import { authenticateUser } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { user, error } = await authenticateUser(request);
    if (error || !user) {
      return unauthorizedResponse(error || 'Unauthorized');
    }

    const { id } = await params;
    const loan = await LoanService.getLoanById(id);

    if (!loan) {
      return errorResponse('Loan not found', 404);
    }

    // Verify loan belongs to user
    if (loan.user.toString() !== user._id.toString()) {
      return errorResponse('Loan not found', 404);
    }

    return successResponse(loan, 'Loan retrieved successfully');
  } catch (error) {
    return handleError(error);
  }
}
