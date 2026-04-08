import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { IrsRefundService } from '@/services/irsRefundService';
import { successResponse, unauthorizedResponse, handleError } from '@/lib/apiResponse';
import { authenticateAdmin } from '@/lib/auth';

// POST /api/admin/irs-refunds/[id]/approve - Approve IRS refund
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
    const refund = await IrsRefundService.approveRefund(id, admin._id.toString());

    return successResponse(refund, 'Refund request approved successfully');
  } catch (error) {
    return handleError(error);
  }
}
