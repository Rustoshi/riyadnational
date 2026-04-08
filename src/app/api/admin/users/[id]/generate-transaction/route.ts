import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { successResponse, unauthorizedResponse, notFoundResponse, errorResponse, handleError } from '@/lib/apiResponse';
import { authenticateAdmin } from '@/lib/auth';
import { User, Transaction } from '@/models';
import { TransactionStatus } from '@/types';

// POST /api/admin/users/[id]/generate-transaction - Generate a transaction for user
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
    const body = await request.json();

    const {
      type,
      amount,
      status,
      senderName,
      senderAccount,
      senderBank,
      receiverName,
      receiverAccount,
      receiverBank,
      bankAddress,
      description,
      date,
      notifyUser,
    } = body;

    // Validate required fields
    if (!type || !amount) {
      return errorResponse('Transaction type and amount are required', 400);
    }

    const user = await User.findById(id);
    if (!user) {
      return notFoundResponse('User not found');
    }

    const parsedAmount = parseFloat(amount);
    const balanceBefore = user.balance;
    let balanceAfter = balanceBefore;

    // Calculate balance after based on transaction type
    const transactionStatus = status || TransactionStatus.COMPLETED;
    if (transactionStatus === TransactionStatus.COMPLETED || transactionStatus === 'completed') {
      if (type.toLowerCase() === 'credit' || type.toLowerCase() === 'deposit') {
        balanceAfter = balanceBefore + parsedAmount;
        user.balance = balanceAfter;
        await user.save();
      } else if (type.toLowerCase() === 'debit' || type.toLowerCase() === 'withdrawal') {
        balanceAfter = Math.max(0, balanceBefore - parsedAmount);
        user.balance = balanceAfter;
        await user.save();
      }
    }

    // Create transaction record with metadata for extra fields
    const transaction = await Transaction.create({
      user: user._id,
      type: type.toLowerCase(),
      amount: parsedAmount,
      balanceBefore,
      balanceAfter,
      currency: user.currency || 'USD',
      status: transactionStatus,
      description: description || `${type} transaction`,
      metadata: {
        senderName: senderName || user.name,
        senderAccount: senderAccount || user.accountNumber,
        senderBank: senderBank || '',
        receiverName: receiverName || '',
        receiverAccount: receiverAccount || '',
        receiverBank: receiverBank || '',
        bankAddress: bankAddress || '',
        generatedByAdmin: true,
        adminId: admin._id,
      },
      createdAt: date ? new Date(date) : new Date(),
    });

    // TODO: Send notification to user if notifyUser is true
    if (notifyUser) {
      // Notification logic would go here
      console.log(`Notification would be sent to user ${user.email}`);
    }

    return successResponse(
      { transaction },
      'Transaction generated successfully'
    );
  } catch (error) {
    return handleError(error);
  }
}
