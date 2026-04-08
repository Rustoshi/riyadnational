import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { paginationSchema } from '@/lib/validations';
import { successResponse, paginatedResponse, unauthorizedResponse, errorResponse, handleZodError, handleError } from '@/lib/apiResponse';
import { authenticateAdmin } from '@/lib/auth';
import { createPaginationResponse } from '@/lib/utils';
import { ZodError } from 'zod';
import { Transaction, Deposit } from '@/models';
import { TransactionType, TransactionStatus, DepositStatus } from '@/types';

// Normalize user-initiated deposit to match admin transaction format
function normalizeDeposit(deposit: Record<string, unknown>) {
  const d = deposit as { _id: unknown; user: unknown; amount: number; status: string; reference: string; paymentMethod: unknown; proofImage?: string; createdAt: unknown };
  return {
    _id: d._id,
    user: d.user,
    amount: d.amount,
    type: 'deposit',
    status: d.status === DepositStatus.APPROVED ? 'completed' : d.status === DepositStatus.REJECTED ? 'failed' : 'pending',
    reference: d.reference,
    description: 'User deposit request',
    balanceBefore: 0,
    balanceAfter: 0,
    createdAt: d.createdAt,
    source: 'user',
    paymentMethod: d.paymentMethod,
    proofImage: d.proofImage,
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
    const txQuery: Record<string, unknown> = { type: TransactionType.DEPOSIT };
    const depositQuery: Record<string, unknown> = {};

    if (status) {
      txQuery.status = status;
      // Map status to deposit status
      if (status === 'completed') depositQuery.status = DepositStatus.APPROVED;
      else if (status === 'failed') depositQuery.status = DepositStatus.REJECTED;
      else if (status === 'pending') depositQuery.status = DepositStatus.PENDING;
      else depositQuery.status = status;
    }

    // Get counts from both collections
    const [txCount, depositCount] = await Promise.all([
      Transaction.countDocuments(txQuery),
      Deposit.countDocuments(depositQuery),
    ]);
    const total = txCount + depositCount;

    // Fetch from both collections and merge
    const [adminDeposits, userDeposits] = await Promise.all([
      Transaction.find(txQuery)
        .populate('user', 'name email accountNumber')
        .sort({ createdAt: -1 })
        .lean(),
      Deposit.find(depositQuery)
        .populate('user', 'name email accountNumber')
        .populate('paymentMethod', 'name type')
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    // Normalize user deposits and merge
    const normalizedUserDeposits = userDeposits.map(d => normalizeDeposit(d as unknown as Record<string, unknown>));
    const allDeposits = [...adminDeposits.map(d => ({ ...d, source: 'admin' })), ...normalizedUserDeposits];

    // Sort by createdAt descending
    allDeposits.sort((a, b) => new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime());

    // Paginate
    const skip = (params.page - 1) * params.limit;
    const paginatedDeposits = allDeposits.slice(skip, skip + params.limit);

    return paginatedResponse(
      paginatedDeposits,
      createPaginationResponse(total, params.page, params.limit),
      'Deposits retrieved successfully'
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
    const { depositId, action, source, editData } = body;

    if (!depositId) {
      return errorResponse('Deposit ID is required', 400);
    }

    // Handle edit action
    if (action === 'edit') {
      if (!editData) {
        return errorResponse('Edit data is required', 400);
      }

      if (source === 'user') {
        // Edit user-initiated deposit
        const deposit = await Deposit.findById(depositId);
        if (!deposit) {
          return errorResponse('Deposit not found', 404);
        }

        if (editData.amount !== undefined) deposit.amount = editData.amount;
        if (editData.status !== undefined) {
          // Map status to deposit status
          if (editData.status === 'completed') deposit.status = DepositStatus.APPROVED;
          else if (editData.status === 'failed') deposit.status = DepositStatus.REJECTED;
          else if (editData.status === 'pending') deposit.status = DepositStatus.PENDING;
        }

        await deposit.save();
        return successResponse(deposit, 'Deposit updated successfully');
      } else {
        // Edit admin transaction
        const transaction = await Transaction.findById(depositId);
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
        return successResponse(transaction, 'Deposit updated successfully');
      }
    }

    // Handle delete action
    if (action === 'delete') {
      if (source === 'user') {
        const deposit = await Deposit.findByIdAndDelete(depositId);
        if (!deposit) {
          return errorResponse('Deposit not found', 404);
        }
        return successResponse(null, 'Deposit deleted successfully');
      } else {
        const transaction = await Transaction.findByIdAndDelete(depositId);
        if (!transaction) {
          return errorResponse('Transaction not found', 404);
        }
        return successResponse(null, 'Deposit deleted successfully');
      }
    }

    // Handle approve/reject actions
    if (!action) {
      return errorResponse('Action is required', 400);
    }

    // Handle user-source deposits via TransactionService (updates balance, sends emails)
    if (source === 'user') {
      const { TransactionService } = await import('@/services/transactionService');

      if (action === 'approve') {
        const deposit = await TransactionService.processDeposit(
          depositId,
          DepositStatus.APPROVED,
          admin._id.toString(),
          body.adminNote
        );
        return successResponse(deposit, 'Deposit approved successfully');
      } else if (action === 'reject') {
        const deposit = await TransactionService.processDeposit(
          depositId,
          DepositStatus.REJECTED,
          admin._id.toString(),
          body.adminNote
        );
        return successResponse(deposit, 'Deposit rejected successfully');
      } else {
        return errorResponse('Invalid action', 400);
      }
    }

    // Handle admin-source transactions (legacy behavior)
    const transaction = await Transaction.findById(depositId);
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

    return successResponse(transaction, `Deposit ${action} successful`);
  } catch (error) {
    return handleError(error);
  }
}

