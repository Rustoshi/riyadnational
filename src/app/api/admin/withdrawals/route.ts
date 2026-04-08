import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { paginationSchema } from '@/lib/validations';
import { successResponse, paginatedResponse, unauthorizedResponse, errorResponse, handleZodError, handleError } from '@/lib/apiResponse';
import { authenticateAdmin } from '@/lib/auth';
import { createPaginationResponse } from '@/lib/utils';
import { ZodError } from 'zod';
import { Transaction, Withdrawal } from '@/models';
import { TransactionType, TransactionStatus, WithdrawalStatus } from '@/types';

// Normalize user-initiated withdrawal to match admin transaction format
function normalizeWithdrawal(withdrawal: unknown) {
  const w = withdrawal as { _id: unknown; user: unknown; amount: number; fee: number; netAmount: number; status: string; reference: string; paymentMethod: unknown; paymentDetails?: unknown; createdAt: unknown };
  return {
    _id: w._id,
    user: w.user,
    amount: w.amount,
    type: 'withdrawal',
    status: w.status === WithdrawalStatus.APPROVED ? 'completed' : w.status === WithdrawalStatus.REJECTED ? 'failed' : 'pending',
    reference: w.reference,
    description: 'User withdrawal request',
    balanceBefore: 0,
    balanceAfter: 0,
    createdAt: w.createdAt,
    source: 'user',
    fee: w.fee,
    netAmount: w.netAmount,
    paymentMethod: w.paymentMethod,
    paymentDetails: w.paymentDetails,
  };
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { admin, error } = await authenticateAdmin(request);
    if (error || !admin) {
      return unauthorizedResponse(error || 'Unauthorized');
    }

    const { searchParams } = new URL(request.url);
    const params = paginationSchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
    });
    const status = searchParams.get('status') as string | undefined;

    // Build queries for both collections
    const txQuery: Record<string, unknown> = { type: TransactionType.WITHDRAWAL };
    const withdrawalQuery: Record<string, unknown> = {};

    if (status) {
      txQuery.status = status;
      // Map status to withdrawal status
      if (status === 'completed') withdrawalQuery.status = WithdrawalStatus.APPROVED;
      else if (status === 'failed') withdrawalQuery.status = WithdrawalStatus.REJECTED;
      else if (status === 'pending') withdrawalQuery.status = WithdrawalStatus.PENDING;
      else withdrawalQuery.status = status;
    }

    // Get counts from both collections
    const [txCount, withdrawalCount] = await Promise.all([
      Transaction.countDocuments(txQuery),
      Withdrawal.countDocuments(withdrawalQuery),
    ]);
    const total = txCount + withdrawalCount;

    // Fetch from both collections and merge
    const [adminWithdrawals, userWithdrawals] = await Promise.all([
      Transaction.find(txQuery)
        .populate('user', 'name email accountNumber')
        .sort({ createdAt: -1 })
        .lean(),
      Withdrawal.find(withdrawalQuery)
        .populate('user', 'name email accountNumber')
        .populate('paymentMethod', 'name type')
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    // Normalize user withdrawals and merge
    const normalizedUserWithdrawals = userWithdrawals.map(w => normalizeWithdrawal(w));
    const allWithdrawals = [...adminWithdrawals.map(w => ({ ...w, source: 'admin' })), ...normalizedUserWithdrawals];

    // Sort by createdAt descending
    allWithdrawals.sort((a, b) => new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime());

    // Paginate
    const skip = (params.page - 1) * params.limit;
    const paginatedWithdrawals = allWithdrawals.slice(skip, skip + params.limit);

    return paginatedResponse(
      paginatedWithdrawals,
      createPaginationResponse(total, params.page, params.limit),
      'Withdrawals retrieved successfully'
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return handleZodError(error);
    }
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
    const { withdrawalId, action, source, editData } = body;

    if (!withdrawalId) {
      return errorResponse('Withdrawal ID is required', 400);
    }

    // Handle edit action
    if (action === 'edit') {
      if (!editData) {
        return errorResponse('Edit data is required', 400);
      }

      if (source === 'user') {
        // Edit user-initiated withdrawal
        const withdrawal = await Withdrawal.findById(withdrawalId);
        if (!withdrawal) {
          return errorResponse('Withdrawal not found', 404);
        }

        if (editData.amount !== undefined) {
          withdrawal.amount = editData.amount;
          withdrawal.netAmount = editData.amount - (withdrawal.fee || 0);
        }
        if (editData.fee !== undefined) {
          withdrawal.fee = editData.fee;
          withdrawal.netAmount = withdrawal.amount - editData.fee;
        }
        if (editData.status !== undefined) {
          // Map status to withdrawal status
          if (editData.status === 'completed') withdrawal.status = WithdrawalStatus.APPROVED;
          else if (editData.status === 'failed') withdrawal.status = WithdrawalStatus.REJECTED;
          else if (editData.status === 'pending') withdrawal.status = WithdrawalStatus.PENDING;
        }

        await withdrawal.save();
        return successResponse(withdrawal, 'Withdrawal updated successfully');
      } else {
        // Edit admin transaction
        const transaction = await Transaction.findById(withdrawalId);
        if (!transaction) {
          return errorResponse('Transaction not found', 404);
        }

        if (editData.amount !== undefined) transaction.amount = editData.amount;
        if (editData.description !== undefined) transaction.description = editData.description;
        if (editData.status !== undefined) transaction.status = editData.status;
        if (editData.balanceBefore !== undefined) transaction.balanceBefore = editData.balanceBefore;
        if (editData.balanceAfter !== undefined) transaction.balanceAfter = editData.balanceAfter;
        if (editData.createdAt !== undefined) transaction.createdAt = new Date(editData.createdAt);

        await transaction.save();
        return successResponse(transaction, 'Withdrawal updated successfully');
      }
    }

    // Handle delete action
    if (action === 'delete') {
      if (source === 'user') {
        const withdrawal = await Withdrawal.findByIdAndDelete(withdrawalId);
        if (!withdrawal) {
          return errorResponse('Withdrawal not found', 404);
        }
        return successResponse(null, 'Withdrawal deleted successfully');
      } else {
        const transaction = await Transaction.findByIdAndDelete(withdrawalId);
        if (!transaction) {
          return errorResponse('Transaction not found', 404);
        }
        return successResponse(null, 'Withdrawal deleted successfully');
      }
    }

    // Handle approve/reject actions
    if (!action) {
      return errorResponse('Action is required', 400);
    }

    const transaction = await Transaction.findById(withdrawalId);
    if (!transaction) {
      return errorResponse('Transaction not found', 404);
    }

    switch (action) {
      case 'approve':
        transaction.status = TransactionStatus.COMPLETED;
        break;
      case 'reject':
        transaction.status = TransactionStatus.FAILED;
        break;
      default:
        return errorResponse('Invalid action', 400);
    }

    await transaction.save();

    return successResponse(transaction, `Withdrawal ${action} successful`);
  } catch (error) {
    return handleError(error);
  }
}
