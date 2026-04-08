import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { CryptoService } from '@/services/cryptoService';
import { successResponse, unauthorizedResponse, errorResponse, handleError } from '@/lib/apiResponse';
import { authenticateUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { user, error } = await authenticateUser(request);
    if (error || !user) {
      return unauthorizedResponse(error || 'Unauthorized');
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type === 'assets') {
      const assets = await CryptoService.getAssets();
      return successResponse(assets, 'Crypto assets retrieved successfully');
    }

    if (type === 'transactions') {
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');
      const { transactions, total } = await CryptoService.getUserTransactions(
        user._id.toString(),
        { page, limit }
      );
      return successResponse({ transactions, total }, 'Transactions retrieved successfully');
    }

    // Default: return wallets
    const wallets = await CryptoService.getUserWallets(user._id.toString());
    return successResponse(wallets, 'Crypto wallets retrieved successfully');
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { user, error } = await authenticateUser(request);
    if (error || !user) {
      return unauthorizedResponse(error || 'Unauthorized');
    }

    const body = await request.json();
    const { action, asset, amount, fromAsset, toAsset, fromAmount } = body;

    if (action === 'buy') {
      if (!asset || !amount) {
        return errorResponse('Asset and amount are required', 400);
      }
      const transaction = await CryptoService.buyCrypto(user._id.toString(), asset, amount);
      return successResponse(transaction, 'Crypto purchase successful', 201);
    }

    if (action === 'sell') {
      if (!asset || !amount) {
        return errorResponse('Asset and amount are required', 400);
      }
      const transaction = await CryptoService.sellCrypto(user._id.toString(), asset, amount);
      return successResponse(transaction, 'Crypto sale successful', 201);
    }

    if (action === 'swap') {
      if (!fromAsset || !toAsset || !fromAmount) {
        return errorResponse('From asset, to asset, and amount are required', 400);
      }
      const transaction = await CryptoService.swapCrypto(
        user._id.toString(),
        fromAsset,
        toAsset,
        fromAmount
      );
      return successResponse(transaction, 'Crypto swap successful', 201);
    }

    return errorResponse('Invalid action', 400);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Insufficient') || error.message.includes('not found')) {
        return errorResponse(error.message, 400);
      }
    }
    return handleError(error);
  }
}
