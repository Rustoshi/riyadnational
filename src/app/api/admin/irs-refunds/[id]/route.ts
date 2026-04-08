import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { IrsRefundService } from '@/services/irsRefundService';
import { successResponse, unauthorizedResponse, notFoundResponse, handleError } from '@/lib/apiResponse';
import { authenticateAdmin } from '@/lib/auth';

// GET /api/admin/irs-refunds/[id] - Get single IRS refund
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
    const refund = await IrsRefundService.getRefundById(id);

    if (!refund) {
      return notFoundResponse('IRS refund not found');
    }

    return successResponse(refund, 'IRS refund retrieved successfully');
  } catch (error) {
    return handleError(error);
  }
}

// DELETE /api/admin/irs-refunds/[id] - Delete IRS refund
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
    await IrsRefundService.deleteRefund(id);

    return successResponse(null, 'IRS refund deleted successfully');
  } catch (error) {
    return handleError(error);
  }
}
