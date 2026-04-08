import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { UserService } from '@/services/userService';
import { successResponse, errorResponse, unauthorizedResponse, handleError } from '@/lib/apiResponse';
import { authenticateUser } from '@/lib/auth';
import { User, Transaction, Transfer, Notification, Activity } from '@/models';
import { generateReference } from '@/lib/utils';
import {
  TransactionType,
  TransactionStatus,
  TransferType,
  TransferStatus,
  NotificationType,
  ActivityActorType,
  UserStatus,
} from '@/types';
import { z } from 'zod';

const bitcoinTransferSchema = z.object({
  amount: z.number().positive('Amount must be positive').min(0.00001, 'Minimum transfer is 0.00001 BTC'),
  recipientAddress: z.string().min(26, 'Invalid Bitcoin address').max(62, 'Invalid Bitcoin address'),
  pin: z.string().length(4, 'PIN must be 4 digits'),
});

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { user, error } = await authenticateUser(request);
    if (error || !user) {
      return unauthorizedResponse(error || 'Unauthorized');
    }

    const body = await request.json();
    
    // Validate request body
    const validationResult = bitcoinTransferSchema.safeParse(body);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return errorResponse(firstError.message, 400);
    }

    const { amount, recipientAddress, pin } = validationResult.data;

    // Get full user data
    const fullUser = await User.findById(user._id);
    if (!fullUser) {
      return errorResponse('User not found', 404);
    }

    // Check account status
    if (fullUser.status === UserStatus.DORMANT) {
      return errorResponse(
        'Your account is currently dormant. Please contact support to reactivate.',
        403
      );
    }

    if (fullUser.status === UserStatus.SUSPENDED) {
      return errorResponse(
        'Your account has been suspended. Please contact support.',
        403
      );
    }

    if (fullUser.status === UserStatus.BLOCKED) {
      return errorResponse(
        'Your account has been blocked. Please contact support.',
        403
      );
    }

    // Verify PIN
    const isPinValid = await UserService.verifyPin(user._id.toString(), pin);
    if (!isPinValid) {
      return errorResponse('Invalid PIN', 401);
    }

    // Check Bitcoin balance
    const currentBtcBalance = fullUser.bitcoinBalance || 0;
    if (currentBtcBalance < amount) {
      return errorResponse(
        `Insufficient Bitcoin balance. Available: ${currentBtcBalance.toFixed(8)} BTC`,
        400
      );
    }

    // Validate Bitcoin address format (basic validation)
    const btcAddressRegex = /^(1|3|bc1|tb1)[a-zA-HJ-NP-Z0-9]{25,62}$/;
    if (!btcAddressRegex.test(recipientAddress)) {
      return errorResponse('Invalid Bitcoin wallet address format', 400);
    }

    // Generate reference
    const reference = generateReference('BTC');

    // Get user's currency for equivalent value
    const userCurrency = fullUser.currency || 'USD';
    const currencyCode = userCurrency.toLowerCase();

    // Fetch current BTC price in user's currency
    let btcPrice: number | null = null;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const priceResponse = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=${currencyCode}`, {
        headers: { 'Accept': 'application/json' },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (priceResponse.ok) {
        const priceData = await priceResponse.json();
        if (priceData.bitcoin?.[currencyCode]) {
          btcPrice = priceData.bitcoin[currencyCode];
        }
      }
    } catch {
      // Price fetch failed - continue without fiat value
    }

    const fiatEquivalent = btcPrice ? amount * btcPrice : null;

    // Deduct Bitcoin balance
    const balanceBefore = currentBtcBalance;
    fullUser.bitcoinBalance = currentBtcBalance - amount;
    await fullUser.save();

    // Create transfer record with PENDING status
    const transfer = await Transfer.create({
      sender: fullUser._id,
      recipientDetails: {
        accountNumber: recipientAddress,
        accountName: 'Bitcoin Wallet',
        bankName: 'Bitcoin Network',
      },
      type: TransferType.INTERNATIONAL,
      amount,
      fee: 0,
      totalAmount: amount,
      currency: 'BTC',
      status: TransferStatus.PENDING,
      reference,
      description: `Bitcoin transfer to ${recipientAddress.substring(0, 8)}...${recipientAddress.substring(recipientAddress.length - 6)}`,
      requiresImfCode: false,
      requiresCotCode: false,
      codesVerified: true,
      metadata: {
        transferType: 'bitcoin',
        recipientAddress,
        btcAmount: amount,
        btcPrice,
        userCurrency,
        fiatEquivalent,
        balanceBefore,
        balanceAfter: fullUser.bitcoinBalance,
      },
    });

    // Create transaction record with PENDING status
    await Transaction.create({
      user: fullUser._id,
      type: TransactionType.TRANSFER_OUT,
      amount,
      balanceBefore,
      balanceAfter: fullUser.bitcoinBalance,
      currency: 'BTC',
      status: TransactionStatus.PENDING,
      description: `Bitcoin transfer - ${reference}`,
      reference,
      metadata: {
        transferId: transfer._id,
        recipientAddress,
        transferType: 'bitcoin',
        btcPrice,
        userCurrency,
        fiatEquivalent,
      },
    });

    // Create notification
    await Notification.create({
      user: fullUser._id,
      title: 'Bitcoin Transfer Initiated',
      message: `Your transfer of ${amount.toFixed(8)} BTC to ${recipientAddress.substring(0, 8)}...${recipientAddress.substring(recipientAddress.length - 6)} is being processed.`,
      type: NotificationType.INFO,
    });

    // Log activity
    await Activity.create({
      actor: fullUser._id,
      actorType: ActivityActorType.USER,
      action: 'bitcoin_transfer',
      resource: 'transfer',
      resourceId: transfer._id,
      details: {
        amount,
        recipientAddress: `${recipientAddress.substring(0, 8)}...${recipientAddress.substring(recipientAddress.length - 6)}`,
        reference,
        status: 'pending',
      },
    });

    return successResponse(
      {
        transferId: transfer._id,
        reference,
        amount,
        recipientAddress,
        status: 'pending',
        newBalance: fullUser.bitcoinBalance,
      },
      'Bitcoin transfer initiated successfully',
      201
    );
  } catch (error) {
    console.error('[BITCOIN_TRANSFER] Error:', error);
    return handleError(error);
  }
}
