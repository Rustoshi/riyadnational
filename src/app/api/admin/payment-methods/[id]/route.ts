import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { PaymentMethod } from '@/models';
import { successResponse, unauthorizedResponse, notFoundResponse, errorResponse, handleError } from '@/lib/apiResponse';
import { authenticateAdmin } from '@/lib/auth';
import { PaymentMethodType, PaymentMethodStatus, FeeType } from '@/types';

// GET /api/admin/payment-methods/[id] - Get single payment method
export async function GET(
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
    const method = await PaymentMethod.findById(id);

    if (!method) {
      return notFoundResponse('Payment method not found');
    }

    return successResponse(method, 'Payment method retrieved successfully');
  } catch (error) {
    return handleError(error);
  }
}

// PUT /api/admin/payment-methods/[id] - Update payment method
export async function PUT(
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
    const method = await PaymentMethod.findById(id);

    if (!method) {
      return notFoundResponse('Payment method not found');
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
    if (type && !Object.values(PaymentMethodType).includes(type)) {
      return errorResponse('Invalid payment method type', 400);
    }

    if (feeType && !Object.values(FeeType).includes(feeType)) {
      return errorResponse('Invalid fee type', 400);
    }

    if (status && !Object.values(PaymentMethodStatus).includes(status)) {
      return errorResponse('Invalid status', 400);
    }

    // Check for duplicate name (excluding current)
    if (name && name !== method.name) {
      const existing = await PaymentMethod.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: id }
      });
      if (existing) {
        return errorResponse('A payment method with this name already exists', 400);
      }
    }

    // Update fields
    if (name !== undefined) method.name = name;
    if (type !== undefined) method.type = type;
    if (details !== undefined) method.details = details;
    if (instructions !== undefined) method.instructions = instructions;
    if (minAmount !== undefined) method.minAmount = minAmount;
    if (maxAmount !== undefined) method.maxAmount = maxAmount;
    if (fee !== undefined) method.fee = fee;
    if (feeType !== undefined) method.feeType = feeType;
    if (status !== undefined) method.status = status;

    await method.save();

    return successResponse(method, 'Payment method updated successfully');
  } catch (error) {
    return handleError(error);
  }
}

// DELETE /api/admin/payment-methods/[id] - Delete payment method
export async function DELETE(
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
    const method = await PaymentMethod.findById(id);

    if (!method) {
      return notFoundResponse('Payment method not found');
    }

    await method.deleteOne();

    return successResponse(null, 'Payment method deleted successfully');
  } catch (error) {
    return handleError(error);
  }
}
