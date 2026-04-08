import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { successResponse, paginatedResponse, unauthorizedResponse, errorResponse, handleError } from '@/lib/apiResponse';
import { authenticateAdmin } from '@/lib/auth';
import { createPaginationResponse } from '@/lib/utils';
import { Transaction, Transfer } from '@/models';
import { TransactionType, TransactionStatus, TransferStatus } from '@/types';

// Normalize user-initiated transfer to match admin transaction format
function normalizeTransfer(transfer: unknown) {
  const t = transfer as { _id: unknown; sender: unknown; recipient?: unknown; recipientDetails?: unknown; type: string; amount: number; fee: number; totalAmount: number; status: string; reference: string; description?: string; createdAt: unknown };
  return {
    _id: t._id,
    user: t.sender,
    amount: t.amount,
    type: t.type === 'internal' ? 'transfer_in' : 'transfer_out',
    status: t.status === TransferStatus.COMPLETED ? 'completed' : t.status === TransferStatus.FAILED || t.status === TransferStatus.CANCELLED ? 'failed' : 'pending',
    reference: t.reference,
    description: t.description || 'User transfer request',
    balanceBefore: 0,
    balanceAfter: 0,
    createdAt: t.createdAt,
    source: 'user',
    fee: t.fee,
    totalAmount: t.totalAmount,
    recipient: t.recipient,
    recipientDetails: t.recipientDetails,
    transferType: t.type,
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') as string | undefined;

    // Build queries for both collections
    const txQuery: Record<string, unknown> = { 
      type: { $in: [TransactionType.TRANSFER_IN, TransactionType.TRANSFER_OUT] } 
    };
    const transferQuery: Record<string, unknown> = {};

    if (status) {
      txQuery.status = status;
      // Map status to transfer status
      if (status === 'completed') transferQuery.status = TransferStatus.COMPLETED;
      else if (status === 'failed') transferQuery.status = { $in: [TransferStatus.FAILED, TransferStatus.CANCELLED] };
      else if (status === 'pending') transferQuery.status = { $in: [TransferStatus.PENDING, TransferStatus.PROCESSING] };
      else transferQuery.status = status;
    }

    // Get counts from both collections
    const [txCount, transferCount] = await Promise.all([
      Transaction.countDocuments(txQuery),
      Transfer.countDocuments(transferQuery),
    ]);
    const total = txCount + transferCount;

    // Fetch from both collections and merge
    const [adminTransfers, userTransfers] = await Promise.all([
      Transaction.find(txQuery)
        .populate('user', 'name email accountNumber')
        .sort({ createdAt: -1 })
        .lean(),
      Transfer.find(transferQuery)
        .populate('sender', 'name email accountNumber')
        .populate('recipient', 'name email accountNumber')
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    // Normalize user transfers and merge
    const normalizedUserTransfers = userTransfers.map(t => normalizeTransfer(t));
    const allTransfers = [...adminTransfers.map(t => ({ ...t, source: 'admin' })), ...normalizedUserTransfers];

    // Sort by createdAt descending
    allTransfers.sort((a, b) => new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime());

    // Paginate
    const skip = (page - 1) * limit;
    const paginatedTransfers = allTransfers.slice(skip, skip + limit);

    return paginatedResponse(
      paginatedTransfers,
      createPaginationResponse(total, page, limit),
      'Transfers retrieved successfully'
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
    const { transferId, action, source, editData } = body;

    if (!transferId) {
      return errorResponse('Transfer ID is required', 400);
    }

    // Handle edit action
    if (action === 'edit') {
      if (!editData) {
        return errorResponse('Edit data is required', 400);
      }

      if (source === 'user') {
        // Edit user-initiated transfer
        const transfer = await Transfer.findById(transferId);
        if (!transfer) {
          return errorResponse('Transfer not found', 404);
        }

        if (editData.amount !== undefined) {
          transfer.amount = editData.amount;
          transfer.totalAmount = editData.amount + (transfer.fee || 0);
        }
        if (editData.fee !== undefined) {
          transfer.fee = editData.fee;
          transfer.totalAmount = transfer.amount + editData.fee;
        }
        if (editData.description !== undefined) transfer.description = editData.description;
        if (editData.status !== undefined) {
          // Map status to transfer status
          if (editData.status === 'completed') transfer.status = TransferStatus.COMPLETED;
          else if (editData.status === 'failed') transfer.status = TransferStatus.FAILED;
          else if (editData.status === 'pending') transfer.status = TransferStatus.PENDING;
        }

        await transfer.save();
        return successResponse(transfer, 'Transfer updated successfully');
      } else {
        // Edit admin transaction
        const transaction = await Transaction.findById(transferId);
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
        return successResponse(transaction, 'Transfer updated successfully');
      }
    }

    // Handle delete action
    if (action === 'delete') {
      if (source === 'user') {
        const transfer = await Transfer.findByIdAndDelete(transferId);
        if (!transfer) {
          return errorResponse('Transfer not found', 404);
        }
        return successResponse(null, 'Transfer deleted successfully');
      } else {
        const transaction = await Transaction.findByIdAndDelete(transferId);
        if (!transaction) {
          return errorResponse('Transaction not found', 404);
        }
        return successResponse(null, 'Transfer deleted successfully');
      }
    }

    // Handle approve/reject/processing actions
    if (!action) {
      return errorResponse('Action is required', 400);
    }

    const transaction = await Transaction.findById(transferId);
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
      case 'processing':
        transaction.status = TransactionStatus.PENDING;
        break;
      default:
        return errorResponse('Invalid action', 400);
    }

    await transaction.save();

    return successResponse(transaction, `Transfer ${action} successful`);
  } catch (error) {
    return handleError(error);
  }
}
