import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { CryptoService } from '@/services/cryptoService';
import { successResponse, unauthorizedResponse, errorResponse, handleError } from '@/lib/apiResponse';
import { authenticateAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { admin, error } = await authenticateAdmin(request);
    if (error || !admin) {
      return unauthorizedResponse(error || 'Unauthorized');
    }

    const assets = await CryptoService.getAssets();
    return successResponse(assets, 'Crypto assets retrieved successfully');
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { admin, error } = await authenticateAdmin(request);
    if (error || !admin) {
      return unauthorizedResponse(error || 'Unauthorized');
    }

    const body = await request.json();
    const { symbol, name, price, icon } = body;

    if (!symbol || !name || !price) {
      return errorResponse('Symbol, name, and price are required', 400);
    }

    const asset = await CryptoService.createAsset({ symbol, name, price, icon });
    return successResponse(asset, 'Crypto asset created successfully', 201);
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
    const { symbol, price, change24h } = body;

    if (!symbol || price === undefined) {
      return errorResponse('Symbol and price are required', 400);
    }

    const asset = await CryptoService.updateAssetPrice(symbol, price, change24h);
    return successResponse(asset, 'Crypto asset price updated successfully');
  } catch (error) {
    return handleError(error);
  }
}
