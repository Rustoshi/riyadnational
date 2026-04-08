import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { successResponse, unauthorizedResponse, notFoundResponse, handleError } from '@/lib/apiResponse';
import { authenticateAdmin } from '@/lib/auth';
import { User, Transaction } from '@/models';

// POST /api/admin/users/[id]/clear - Clear user account (reset all balances and delete transactions)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { admin, error } = await authenticateAdmin(request);
    if (error || !admin) {
      return unauthorizedResponse(error || 'Unauthorized');
    }

    const { id } = await params;
    const user = await User.findById(id);
    
    if (!user) {
      return notFoundResponse('User not found');
    }

    // Delete all user transactions (deposits and withdrawals)
    await Transaction.deleteMany({ user: id });

    // Reset all balances to 0
    user.balance = 0;
    user.bonus = 0;
    user.tradingBalance = 0;
    await user.save();

    return successResponse(
      { 
        balance: user.balance,
        bonus: user.bonus,
        tradingBalance: user.tradingBalance
      },
      'Account cleared to $0.00'
    );
  } catch (error) {
    return handleError(error);
  }
}
