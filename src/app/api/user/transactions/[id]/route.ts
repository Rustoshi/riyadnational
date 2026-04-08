import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import Transaction from '@/models/Transaction';
import { successResponse, unauthorizedResponse, notFoundResponse, handleError } from '@/lib/apiResponse';
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

    const transaction = await Transaction.findOne({
      _id: id,
      user: user._id,
    }).lean();

    if (!transaction) {
      return notFoundResponse('Transaction not found');
    }

    return successResponse(transaction, 'Transaction retrieved successfully');
  } catch (error) {
    return handleError(error);
  }
}
