import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { PaymentMethod } from '@/models';
import { successResponse, unauthorizedResponse, errorResponse, handleError } from '@/lib/apiResponse';
import { authenticateAdmin } from '@/lib/auth';
import { PaymentMethodType, PaymentMethodStatus, FeeType } from '@/types';

// GET /api/admin/payment-methods - List all payment methods
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { admin, error } = await authenticateAdmin(request);
    if (error || !admin) {
      return unauthorizedResponse(error || 'Unauthorized');
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as PaymentMethodType | null;
    const status = searchParams.get('status') as PaymentMethodStatus | null;

    const query: Record<string, unknown> = {};
    if (type) query.type = type;
    if (status) query.status = status;

    const methods = await PaymentMethod.find(query).sort({ createdAt: -1 });

    return successResponse(methods, 'Payment methods retrieved successfully');
  } catch (error) {
    return handleError(error);
  }
}

// POST /api/admin/payment-methods - Create a new payment method
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { admin, error } = await authenticateAdmin(request);
    if (error || !admin) {
      return unauthorizedResponse(error || 'Unauthorized');
    }

    const body = await request.json();
    const {
      name,
      type,
      details,
      instructions,
      minAmount,
      maxAmount,
      fee,
      feeType,
      status,
    } = body;

    // Validation
    if (!name || !type) {
      return errorResponse('Name and type are required', 400);
    }

    if (!Object.values(PaymentMethodType).includes(type)) {
      return errorResponse('Invalid payment method type', 400);
    }

    // Check for duplicate name
    const existing = await PaymentMethod.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existing) {
      return errorResponse('A payment method with this name already exists', 400);
    }

    const method = await PaymentMethod.create({
      name,
      type,
      details: details || {},
      instructions,
      minAmount: minAmount || 1,
      maxAmount: maxAmount || 1000000,
      fee: fee || 0,
      feeType: feeType || FeeType.FIXED,
      status: status || PaymentMethodStatus.ACTIVE,
    });

    return successResponse(method, 'Payment method created successfully');
  } catch (error) {
    return handleError(error);
  }
}
