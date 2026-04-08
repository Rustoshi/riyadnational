import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { successResponse, unauthorizedResponse, notFoundResponse, errorResponse, handleError } from '@/lib/apiResponse';
import { authenticateAdmin } from '@/lib/auth';
import { User, Transaction } from '@/models';
import { TransactionType, TransactionStatus } from '@/types';

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
    const { type, amount, balanceType = 'cash', scope, sender, receiverName, receiverBank, receiverAccount, description, date, notifyUser } = body;

    if (!type || !amount || amount <= 0) {
      return errorResponse('Invalid type or amount', 400);
    }

    const user = await User.findById(id);
    if (!user) {
      return notFoundResponse('User not found');
    }

    // Determine which balance to use
    const isCrypto = balanceType === 'crypto';
    
    // Store balance before transaction
    const balanceBefore = isCrypto ? (user.bitcoinBalance || 0) : user.balance;

    // Update balance based on type
    if (type === 'credit') {
      if (isCrypto) {
        user.bitcoinBalance = (user.bitcoinBalance || 0) + amount;
      } else {
        user.balance += amount;
      }
    } else if (type === 'debit') {
      const currentBalance = isCrypto ? (user.bitcoinBalance || 0) : user.balance;
      if (currentBalance < amount) {
        return errorResponse(`Insufficient ${isCrypto ? 'crypto' : 'cash'} balance`, 400);
      }
      if (isCrypto) {
        user.bitcoinBalance = (user.bitcoinBalance || 0) - amount;
      } else {
        user.balance -= amount;
      }
    } else {
      return errorResponse('Invalid transaction type', 400);
    }

    // Balance after transaction
    const balanceAfter = isCrypto ? (user.bitcoinBalance || 0) : user.balance;

    await user.save();

    // Create transaction record
    const transaction = await Transaction.create({
      user: user._id,
      type: type === 'credit' ? TransactionType.DEPOSIT : TransactionType.WITHDRAWAL,
      amount,
      balanceBefore,
      balanceAfter,
      status: TransactionStatus.COMPLETED,
      description: description || `Admin ${type} - ${scope || 'Manual'}${isCrypto ? ' (BTC)' : ''}`,
      reference: `ADM${Date.now()}`,
      metadata: {
        scope,
        balanceType,
        sender: sender || '',
        receiverName: receiverName || '',
        receiverBank: receiverBank || '',
        receiverAccount: receiverAccount || '',
        adminId: admin._id,
        backdated: date || null,
      },
      createdAt: date ? new Date(date) : new Date(),
    });

    // Send email notification if notifyUser is true
    if (notifyUser) {
      try {
        const { EmailService } = await import('@/services/emailService');
        const transactionDescription = description || `Admin ${type} - ${scope || 'Manual'}${isCrypto ? ' (BTC)' : ''}`;
        
        if (type === 'credit') {
          await EmailService.sendCreditAlertEmail(user, {
            amount,
            description: transactionDescription,
            newBalance: balanceAfter,
          });
        } else {
          await EmailService.sendDebitAlertEmail(user, {
            amount,
            description: transactionDescription,
            newBalance: balanceAfter,
          });
        }
        console.log(`[Topup] ${type} notification email sent to:`, user.email);
      } catch (emailError) {
        console.error(`[Topup] Failed to send ${type} notification email:`, emailError);
        // Don't fail the request if email fails
      }
    }

    return successResponse(
      { 
        newBalance: isCrypto ? user.bitcoinBalance : user.balance,
        transaction: transaction.toObject(),
      },
      `Account ${type}ed successfully`
    );
  } catch (error) {
    return handleError(error);
  }
}
