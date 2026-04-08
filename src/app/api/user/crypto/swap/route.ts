import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { User, Transaction } from '@/models';
import { successResponse, unauthorizedResponse, errorResponse, handleError } from '@/lib/apiResponse';
import { authenticateUser } from '@/lib/auth';
import { TransactionType, TransactionStatus } from '@/types';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { user, error } = await authenticateUser(request);
    if (error || !user) {
      return unauthorizedResponse(error || 'Unauthorized');
    }

    const body = await request.json();
    const { fromAsset, toAsset, fromAmount, userCurrency: requestCurrency } = body;

    // Validate input
    if (!fromAsset || !toAsset || !fromAmount) {
      return errorResponse('From asset, to asset, and amount are required', 400);
    }

    if (fromAsset === toAsset) {
      return errorResponse('Cannot swap to the same asset', 400);
    }

    if (!['FIAT', 'BTC'].includes(fromAsset) || !['FIAT', 'BTC'].includes(toAsset)) {
      return errorResponse('Only FIAT and BTC swaps are supported', 400);
    }

    const amount = parseFloat(fromAmount);
    if (isNaN(amount) || amount <= 0) {
      return errorResponse('Invalid amount', 400);
    }

    // Get current user data
    const currentUser = await User.findById(user._id);
    if (!currentUser) {
      return errorResponse('User not found', 404);
    }

    // Get user's currency from DB (fallback to request currency or USD)
    const userCurrency = currentUser.currency || requestCurrency || 'USD';
    const currencyCode = userCurrency.toLowerCase();

    // Check balance
    const fromBalance = fromAsset === 'FIAT' ? currentUser.balance : currentUser.bitcoinBalance;
    if (amount > fromBalance) {
      return errorResponse(`Insufficient ${userCurrency} balance`, 400);
    }

    // Fetch current BTC price from CoinGecko with retry
    let btcPrice: number | null = null;
    const maxRetries = 3;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
        
        const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=${currencyCode}`, {
          headers: {
            'Accept': 'application/json',
          },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.bitcoin && data.bitcoin[currencyCode] && typeof data.bitcoin[currencyCode] === 'number') {
          btcPrice = data.bitcoin[currencyCode];
          break; // Success, exit retry loop
        } else {
          throw new Error('Invalid API response format');
        }
      } catch (error) {
        console.error(`Failed to fetch BTC price (attempt ${attempt + 1}):`, error);
        
        if (attempt < maxRetries) {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }

    // If we couldn't get a live price, reject the swap to prevent incorrect conversions
    if (btcPrice === null) {
      return errorResponse('Unable to fetch current BTC price. Please try again later.', 503);
    }

    // Calculate conversion (no fees)
    let toAmount: number;
    if (fromAsset === 'FIAT' && toAsset === 'BTC') {
      // FIAT to BTC
      toAmount = amount / btcPrice;
    } else {
      // BTC to FIAT
      toAmount = amount * btcPrice;
    }

    // Update user balances
    if (fromAsset === 'FIAT') {
      currentUser.balance -= amount;
      currentUser.bitcoinBalance += toAmount;
    } else {
      currentUser.bitcoinBalance -= amount;
      currentUser.balance += toAmount;
    }

    await currentUser.save();

    // Create transaction records with unique references
    const baseReference = `SWAP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const debitReference = `${baseReference}-OUT`;
    const creditReference = `${baseReference}-IN`;

    // Calculate equivalents in user's currency for both sides
    const debitFiatEquivalent = fromAsset === 'FIAT' ? amount : amount * btcPrice;
    const creditFiatEquivalent = toAsset === 'FIAT' ? toAmount : toAmount * btcPrice;

    // Debit transaction (from asset) - amount stored as positive, type indicates debit
    const debitTransaction = await Transaction.create({
      user: currentUser._id,
      type: fromAsset === 'FIAT' ? TransactionType.WITHDRAWAL : TransactionType.TRANSFER_OUT,
      amount: amount,
      balanceBefore: fromBalance,
      balanceAfter: fromAsset === 'FIAT' ? currentUser.balance : currentUser.bitcoinBalance,
      currency: fromAsset === 'FIAT' ? userCurrency : 'BTC',
      status: TransactionStatus.COMPLETED,
      description: `Swap ${amount} ${fromAsset === 'FIAT' ? userCurrency : 'BTC'} to ${toAmount.toFixed(fromAsset === 'FIAT' ? 8 : 2)} ${toAsset === 'FIAT' ? userCurrency : 'BTC'}`,
      reference: debitReference,
      metadata: {
        swapType: 'debit',
        swapReference: baseReference,
        fromAsset: fromAsset === 'FIAT' ? userCurrency : 'BTC',
        toAsset: toAsset === 'FIAT' ? userCurrency : 'BTC',
        fromAmount: amount,
        toAmount,
        btcPrice,
        userCurrency,
        fiatEquivalent: debitFiatEquivalent,
        fee: 0
      }
    });

    // Credit transaction (to asset)
    const creditTransaction = await Transaction.create({
      user: currentUser._id,
      type: toAsset === 'FIAT' ? TransactionType.DEPOSIT : TransactionType.TRANSFER_IN,
      amount: toAmount,
      balanceBefore: toAsset === 'FIAT' ? (currentUser.balance - toAmount) : (currentUser.bitcoinBalance - toAmount),
      balanceAfter: toAsset === 'FIAT' ? currentUser.balance : currentUser.bitcoinBalance,
      currency: toAsset === 'FIAT' ? userCurrency : 'BTC',
      status: TransactionStatus.COMPLETED,
      description: `Swap ${amount} ${fromAsset === 'FIAT' ? userCurrency : 'BTC'} to ${toAmount.toFixed(toAsset === 'FIAT' ? 2 : 8)} ${toAsset === 'FIAT' ? userCurrency : 'BTC'}`,
      reference: creditReference,
      metadata: {
        swapType: 'credit',
        swapReference: baseReference,
        fromAsset: fromAsset === 'FIAT' ? userCurrency : 'BTC',
        toAsset: toAsset === 'FIAT' ? userCurrency : 'BTC',
        fromAmount: amount,
        toAmount,
        btcPrice,
        userCurrency,
        fiatEquivalent: creditFiatEquivalent,
        fee: 0
      }
    });

    return successResponse({
      swap: {
        fromAsset,
        toAsset,
        fromAmount: amount,
        toAmount,
        btcPrice,
        fee: 0,
        reference: baseReference
      },
      transactions: [debitTransaction, creditTransaction],
      newBalances: {
        fiat: currentUser.balance,
        btc: currentUser.bitcoinBalance,
        currency: userCurrency
      }
    }, 'Swap completed successfully', 201);

  } catch (error) {
    console.error('Swap error:', error);
    return handleError(error);
  }
}
